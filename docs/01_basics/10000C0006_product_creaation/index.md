# 物料(RAP)

RAP框架下，各种事务操作都应该在Behavior Definition里，因此需要注意，不能有Commit或Rollback操作。

经研究，以下两种适用于RAP框架下的物料操作

> 仅作展示用，下面代码只维护基础视图和物料描述

## 本地调用公共接口

使用 **/iwbep/cl_cp_client_proxy_fact=>create_v2_local_proxy** 创建本地代理对象，模拟公共接口调用。

> 目前来说，这种方式仅支持V2版本的公共接口，V4版本由于会触发Commit/Rollback，无法使用

<details>
  <summary>示例代码</summary>

```ABAP

*&---------------------------------------------------------------------*
*& 模拟公共接口（A2X/V2）调用
*&---------------------------------------------------------------------*
" 演示用，假设这是程序的入参和出参
TYPES:
  BEGIN OF ty_datalake,
    matnr TYPE mara-matnr,
    maktx TYPE makt-maktx,
  END OF ty_datalake.
TYPES tt_datalake TYPE STANDARD TABLE OF ty_datalake.

" 定义参数格式
TYPES:
  BEGIN OF ty_entity.
    INCLUDE TYPE a_product.
TYPES:
    to_description TYPE STANDARD TABLE OF a_productdescription WITH EMPTY KEY,
  END OF ty_entity.
" 暂时没找到批量处理的方法，不过为了保持和V4格式一致，这里还是保留批处理结构
TYPES:
  BEGIN OF ty_batch,
    data_ref      TYPE REF TO data,
    request_body  TYPE ty_entity,
    request       TYPE REF TO /iwbep/if_cp_request_create,
    response_body TYPE ty_entity,
    response      TYPE REF TO /iwbep/if_cp_response_create,
  END OF ty_batch.

DATA:
  lt_batch TYPE STANDARD TABLE OF ty_batch WITH EMPTY KEY,
  ls_batch TYPE ty_batch,
  lv_mtype TYPE bapi_mtype,
  lv_msg   TYPE bapi_msg.

DATA:
  lo_client_proxy             TYPE REF TO /iwbep/if_cp_client_proxy,
  lo_create_request_changeset TYPE REF TO /iwbep/if_cp_request_changeset,
  lo_create_request           TYPE REF TO /iwbep/if_cp_request_create,
  lo_create_response          TYPE REF TO /iwbep/if_cp_response_create,
  lo_data_desc_node_root      TYPE REF TO /iwbep/if_cp_data_desc_node,
  lo_data_desc_node_child     TYPE REF TO /iwbep/if_cp_data_desc_node,
  lo_entity_list_resource     TYPE REF TO /iwbep/if_cp_resource_list.

TRY.
    " OData代理
    " ID和Version可以从S4HANA_OP_API包中查找
    DATA: ls_service_key TYPE /iwbep/if_cp_client_proxy=>ty_s_service_key_v2.
    ls_service_key = VALUE #( service_id      = 'API_PRODUCT_SRV'
                              service_version = '0001' ).
    lo_client_proxy = /iwbep/cl_cp_client_proxy_fact=>create_v2_local_proxy( is_service_key     = ls_service_key
                                                                            iv_do_write_traces = abap_true ).

    " 创建资源对象
    lo_entity_list_resource = lo_client_proxy->create_resource_for_entity_set( 'A_Product' ).

    LOOP AT ct_datalake REFERENCE INTO DATA(lr_datalake).
      " 还要回写消息，统一记录起来
      CLEAR ls_batch.
      ls_batch-data_ref = lr_datalake.
      INSERT ls_batch INTO TABLE lt_batch REFERENCE INTO DATA(lr_batch).

      " 基础视图
      lr_batch->request_body-producttype = 'FERT'.
      lr_batch->request_body-industrysector = 'M'.
      lr_batch->request_body-baseunit = 'EA'.
      " 物料描述
      lr_batch->request_body-to_description = VALUE #( ( language = '1' productdescription = lr_datalake->productname ) ).

      "
      lr_batch->request =
      lo_create_request = lo_entity_list_resource->create_request_for_create( ).
      " 节点描述
      lo_data_desc_node_root = lo_create_request->create_data_descripton_node( ).
      lo_data_desc_node_child = lo_data_desc_node_root->add_child( 'TO_DESCRIPTION' ).

      lo_create_request->set_deep_business_data( is_business_data    = lr_batch->request_body
                                                io_data_description = lo_data_desc_node_root ).
      lo_create_request->execute( ).
    ENDLOOP.

    " 回写执行消息
    LOOP AT lt_batch REFERENCE INTO lr_batch.
      TRY.
          lo_create_request = lr_batch->request->check_execution( ).
          IF lo_create_request IS BOUND.
            lo_create_response = lo_create_request->get_response(  ).
            lo_create_response->get_business_data( IMPORTING es_business_data = lr_batch->response_body ).
          ENDIF.
        CATCH /iwbep/cx_cp_remote INTO DATA(lx_cp_remote).
          " HTTP Status Code - {@link /IWBEP/CX_CP_REMOTE.data:HTTP_STATUS_CODE}
          " HTTP Status Reason Message - {@link /IWBEP/CX_CP_REMOTE.data:HTTP_STATUS_MESSAGE}
          " OData Error Details - {@link /IWBEP/CX_CP_REMOTE.data:S_ODATA_ERROR}
          " 还要判断HTTP状态等，挺麻烦的，先简单弄下
          lv_mtype = 'E'.
          lv_msg = lx_cp_remote->s_odata_error-message.
      ENDTRY.

      IF lr_batch->response_body-product IS NOT INITIAL.
        lr_datalake ?= lr_batch->data_ref.
        lr_datalake->product = lr_batch->response_body-product.
        lr_datalake->mtype = 'S'.
      ELSE.
        lr_datalake ?= lr_batch->data_ref.
        lr_datalake->mtype = lv_mtype.
        lr_datalake->msg = lv_msg.
      ENDIF.
    ENDLOOP.

  CATCH /iwbep/cx_gateway INTO DATA(lx_gateway).
    lv_msg = lx_gateway->get_text( ).
    _write_error( EXPORTING iv_msg = lv_msg CHANGING ct_datalake = ct_datalake ).
    RETURN.
ENDTRY.

```

</details>

## 内部API

内部API基本上找不到资料，都是看代码找到的。上面公共接口本质上也是调用了这些API，所以也一并写出来

<details>
  <summary>示例代码</summary>

```ABAP

" 演示用，假设这是程序的入参和出参
TYPES:
  BEGIN OF ty_datalake,
    matnr TYPE mara-matnr,
    maktx TYPE makt-maktx,
  END OF ty_datalake.
TYPES tt_datalake TYPE STANDARD TABLE OF ty_datalake.

*&---------------------------------------------------------------------*
*& 使用内部API（cl_cmd_prod_data_api）创建物料，代码类似以前的BAPI
*&---------------------------------------------------------------------*
DATA: lt_unified_api_data TYPE cmd_prd_t_unified_prod_data,
      ls_unified_api_data TYPE cmd_prd_s_unified_prod_data,
      lt_prodwise_output  TYPE cl_cmd_prod_data_api=>if_cmd_product_maint_api~tt_pmd_output,
      lv_has_error        TYPE boole_d VALUE abap_false,
      lv_product          TYPE productnumber,
      lv_mtype            TYPE bapi_mtype,
      lv_msg              TYPE bapi_msg.

*&---------------------------------------------------------------------*
*& 数据填充
*&---------------------------------------------------------------------*
LOOP AT ct_datalake REFERENCE INTO DATA(lr_datalake).
  CLEAR ls_unified_api_data.

  " 对于非外部给号物料，需设置S_TEMP_NUM=X
  IF lr_datalake->product IS INITIAL.
    lr_datalake->product = |%{ sy-tabix }|.
    ls_unified_api_data-s_temp_num = abap_true.
  ENDIF.

*&---------------------------------------------------------------------*
*& 物料基础视图
*&---------------------------------------------------------------------*
  ls_unified_api_data-product-product = lr_datalake->product.
  ls_unified_api_data-product-productdescription = lr_datalake->productname.
  ls_unified_api_data-product-industrysector = 'M'.
  ls_unified_api_data-product-producttype = 'FERT'.
  ls_unified_api_data-product-baseunit = '11'. " 因为不想在测试中创建物料，这里随便给个错误值

*&---------------------------------------------------------------------*
*& 物料描述
*&---------------------------------------------------------------------*
  DATA ls_prd_descr LIKE LINE OF ls_unified_api_data-prd_descr.
  CLEAR ls_prd_descr.
  ls_prd_descr-product = lr_datalake->product.
  ls_prd_descr-language = '1'.
  ls_prd_descr-productdescription = lr_datalake->productname.
  INSERT ls_prd_descr INTO TABLE ls_unified_api_data-prd_descr.

  INSERT ls_unified_api_data INTO TABLE lt_unified_api_data.
ENDLOOP.

*&---------------------------------------------------------------------*
*& 复制标准代码，价格优先根据科目价格
*&---------------------------------------------------------------------*
LOOP AT lt_unified_api_data ASSIGNING FIELD-SYMBOL(<ls_unified_api_data>).
  LOOP AT <ls_unified_api_data>-ml_prices ASSIGNING FIELD-SYMBOL(<ls_ml_prices>).
    TRY .
        DATA(lr_ml_account) = REF #( <ls_unified_api_data>-ml_account[ product = <ls_ml_prices>-product
                                                                        valuationarea = <ls_ml_prices>-valuationarea
                                                                        valuationtype = <ls_ml_prices>-valuationtype
                                                                        currencyrole = <ls_ml_prices>-currencyrole ] ).
        <ls_ml_prices>-priceunitqty = lr_ml_account->priceunitqty.
      CATCH cx_sy_itab_line_not_found.
    ENDTRY.
  ENDLOOP.
ENDLOOP.

*&---------------------------------------------------------------------*
*& API调用
*&---------------------------------------------------------------------*
cl_cmd_prod_data_api=>get_instance(
  IMPORTING
    eo_cmd_prod_data_api = DATA(lo_unified_prod_data_api)
).

TRY .
    lo_unified_prod_data_api->if_cmd_product_maint_api~check(
      IMPORTING
        et_prodwise_output = lt_prodwise_output
      CHANGING
        ct_data            = lt_unified_api_data
    ).
  CATCH cx_cmd_product_maint_api INTO DATA(lx_cmd_product_maint_api).
    lv_msg = lx_cmd_product_maint_api->if_message~get_text( ).
    _write_error( EXPORTING iv_msg = lv_msg CHANGING ct_datalake = ct_datalake ).
    RETURN.
ENDTRY.

LOOP AT lt_prodwise_output ASSIGNING FIELD-SYMBOL(<ls_prodwise_output>).
  IF <ls_prodwise_output>-enqueue_failed = abap_true OR <ls_prodwise_output>-update_failed = abap_true.
    lv_has_error = abap_true.
    READ TABLE ct_datalake REFERENCE INTO lr_datalake WITH KEY product = <ls_prodwise_output>-product.
    IF sy-subrc = 0.
      LOOP AT <ls_prodwise_output>-t_message ASSIGNING FIELD-SYMBOL(<ls_message>) WHERE msgty CA 'EAX'.
        MESSAGE ID <ls_message>-msgid TYPE <ls_message>-msgty NUMBER <ls_message>-msgno
        WITH <ls_message>-msgv1 <ls_message>-msgv2 <ls_message>-msgv3 <ls_message>-msgv4
        INTO lv_msg.
        lr_datalake->mtype = 'E'.
        lr_datalake->msg = |{ lr_datalake->msg }{ lv_msg };|.
      ENDLOOP.
    ENDIF.
  ELSEIF <ls_prodwise_output>-is_new_number = abap_true.
    READ TABLE ct_datalake REFERENCE INTO lr_datalake WITH KEY product = <ls_prodwise_output>-product_temp.
    IF sy-subrc = 0.
      lr_datalake->product = <ls_prodwise_output>-product.
      lr_datalake->mtype = 'S'.
      lr_datalake->msg = |物料{ <ls_prodwise_output>-product }创建成功|.
    ENDIF.
  ENDIF.
ENDLOOP.

IF lv_has_error = abap_false.
  TRY .
      lo_unified_prod_data_api->if_cmd_product_maint_api~save( ).
    CATCH cx_cmd_product_maint_api INTO DATA(lx_cmd_product_maint_api_save).
      lv_msg = lx_cmd_product_maint_api_save->if_message~get_text( ).
      _write_error( EXPORTING iv_msg = lv_msg CHANGING ct_datalake = ct_datalake ).
  ENDTRY.
ENDIF.

```

</details>

## 测试

RAP开发通常在Eclipse上进行，因此测试也应使用类进行测试，通过基础接口if_oo_adt_classrun，类可直接运行。

另外为了模拟用户操作，使用EML方式触发Behavior：

<details open>
  <summary>测试用例</summary>

```ABAP

CLASS ycl_clean_core_demo IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.

    " 模拟界面点击按钮创建物料
    MODIFY ENTITIES OF zr_ytproduct
        ENTITY datalake
        EXECUTE CreateErpProduct
        FROM VALUE #( ( uuid = '8F0EA20832B71FE08CAE1FF329BDD452' ) ).

    " 执行
    COMMIT ENTITIES
        RESPONSE OF zr_ytproduct
        FAILED DATA(commit_failed)
        REPORTED DATA(commit_reported).
    IF commit_failed IS NOT INITIAL.
      out->write( commit_failed ).
      RETURN.
    ENDIF.

    " 读取处理结果
    READ ENTITY zr_ytproduct
        ALL FIELDS WITH VALUE #( ( %key-uuid = '8F0EA20832B71FE08CAE1FF329BDD452' ) )
        RESULT FINAL(result).

    " 打印结果到控制台
    out->write( result ).

  ENDMETHOD.

ENDCLASS.

```

</details>

> 参考：[RAP开发流程示例](/09_cloud/80030C0002_rap_dev_demo/index.md)
