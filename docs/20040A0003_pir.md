# 计划独立需求（PIR）

## PIR删除

<details>
  <summary>示例代码</summary>

```ABAP

*&---------------------------------------------------------------------*
*&      Form  FRM_PIR_DELETE
*&---------------------------------------------------------------------*
*       text
*----------------------------------------------------------------------*
*      -->P_<FS_HEAD>_MATNR  text
*      -->P_P_WERKS  text
*      -->P_P_VERSB  text
*----------------------------------------------------------------------*
FORM frm_pir_delete USING p_matnr TYPE pbim-matnr
                          p_werks TYPE pbim-werks
                          p_versb TYPE pbim-versb.

  DATA lt_bdcdata TYPE STANDARD TABLE OF bdcdata WITH EMPTY KEY.
  DATA ls_bdcdata TYPE bdcdata .

  DEFINE _bdc_dynpro.
    CLEAR ls_bdcdata.
    ls_bdcdata-program = &1.
    ls_bdcdata-dynpro = &2.
    ls_bdcdata-dynbegin = 'X'.
    INSERT ls_bdcdata INTO TABLE lt_bdcdata.
  END-OF-DEFINITION.

  DEFINE _bdc_field.
    CLEAR ls_bdcdata.
    ls_bdcdata-fnam = &1.
    ls_bdcdata-fval = &2.
    INSERT ls_bdcdata INTO TABLE lt_bdcdata.
  END-OF-DEFINITION.

  " MD62筛选页面
  _bdc_dynpro 'SAPMM60X' '0106'.
  _bdc_field:
    'BDC_OKCODE' '/00',
    'AM60X-MATAW' 'X',
    'AM60X-MATNR' p_matnr,
    'AM60X-PRGRP' '',
    'AM60X-PBDNR' '',
    'RM60X-BEDAE' '',
    'AM60X-WERKS' p_werks,
    'AM60X-VERAW' 'X',
    'RM60X-VERSB' p_versb.

  " 全选
  _bdc_dynpro 'SAPLM60E' '0200'.
  _bdc_field:
    'BDC_OKCODE' '=ALMK'.

  " 点击删除按钮
  _bdc_dynpro 'SAPLM60E' '0200'.
  _bdc_field:
    'BDC_OKCODE' '=POLO'.

  " 点击确认
  _bdc_dynpro 'SAPLSPO1' '0500'.
  _bdc_field:
    'BDC_OKCODE' '=OPT1'.

  " 保存
  _bdc_dynpro 'SAPLM60E' '0200'.
  _bdc_field:
    'BDC_OKCODE' '=SICH'.

  DATA ls_option TYPE ctu_params.
  ls_option-dismode = 'N'. " 后台
  ls_option-updmode = 'L'. " 本地
  ls_option-nobinpt = 'X'. " 有弹窗，需要启用这个标识

  DATA lt_message TYPE STANDARD TABLE OF bdcmsgcoll WITH EMPTY KEY.

  CALL TRANSACTION 'MD62' USING lt_bdcdata
        OPTIONS FROM ls_option
        MESSAGES INTO lt_message.
  " 不管如何，BDC都回滚不了，直接提交了事
  COMMIT WORK AND WAIT.
ENDFORM.                    " FRM_PIR_DELETE

```

</details>

## PIR维护

<details>
  <summary>示例代码</summary>

```ABAP

FORM frm_import_pir .
  " 导入数据校验
  FIELD-SYMBOLS <fs_data_tab> TYPE STANDARD TABLE.
  ASSIGN gr_data_tab->* TO <fs_data_tab>.
  CHECK <fs_data_tab> IS NOT INITIAL.

  " 版本下全部计划独立需求
  TYPES:
    BEGIN OF ty_pbim,
      matnr TYPE pbim-matnr,
      werks TYPE pbim-werks,
      bedae TYPE pbim-bedae,
      versb TYPE pbim-versb,
      pbdnr TYPE pbim-pbdnr,
      vervs TYPE pbim-vervs,
      loevr TYPE pbim-loevr,
    END OF ty_pbim.
  TYPES tt_pbim TYPE STANDARD TABLE OF ty_pbim WITH EMPTY KEY.
  DATA lt_pbim TYPE tt_pbim.

  " 估计是指代物料？
  DATA l_bedae TYPE pbim-bedae VALUE 'VSF'.
  DATA l_pbdnr TYPE pbim-pbdnr VALUE ''.
  DATA l_vervs TYPE pbim-vervs VALUE 'X'.

  " 查询版本下，所有预测数据
  SELECT matnr werks bedae versb pbdnr vervs loevr
    FROM pbim
    INTO TABLE lt_pbim
    WHERE werks = p_werks
      AND bedae = l_bedae
      AND versb = p_versb
      AND pbdnr = l_pbdnr.
  SORT lt_pbim BY matnr werks bedae versb pbdnr.

  " 创建/修改
  DATA ls_pir_item TYPE bapisitemr.
  DATA lt_pir_schedule_in TYPE TABLE OF bapisshdin.
  DATA lt_return TYPE TABLE OF bapireturn1.
  " 整体的一个状态
  DATA l_err TYPE xflag.

  " 逐行执行
  LOOP AT <fs_data_tab> ASSIGNING <fs_data>.
    ASSIGN COMPONENT gc_suffix-head OF STRUCTURE <fs_data> TO <fs_head>.
    ASSIGN COMPONENT gc_suffix-forecast OF STRUCTURE <fs_data> TO FIELD-SYMBOL(<fs_forecast>).

    CLEAR ls_pir_item.
    ls_pir_item-material = <fs_head>-matnr. " 物料
    ls_pir_item-plant = p_werks. " 工厂
    ls_pir_item-requ_type = l_bedae. " 需求类型
    ls_pir_item-version = p_versb. " 版本
    ls_pir_item-req_number = l_pbdnr. " 需求计划
    ls_pir_item-vers_activ = l_vervs. " 激活

    CLEAR lt_pir_schedule_in.
    LOOP AT gt_date_list REFERENCE INTO DATA(lr_date).
      ASSIGN COMPONENT lr_date->fieldname OF STRUCTURE <fs_forecast> TO FIELD-SYMBOL(<fs_nump>).
      " 有个疑问，导入为0是不是就不用导入了？
      IF <fs_nump> IS NOT INITIAL.
        APPEND VALUE #(
          req_date = lr_date->date
          req_qty = <fs_nump>
          date_type = '1' " 表示：天
          prod_ves = <fs_head>-verid
        ) TO lt_pir_schedule_in REFERENCE INTO DATA(lr_pir_schedule_in).
      ENDIF.
    ENDLOOP.

    " 检查版本下的物料是否存在
    READ TABLE lt_pbim TRANSPORTING NO FIELDS
    WITH KEY matnr = ls_pir_item-material
             werks = ls_pir_item-plant
             bedae = ls_pir_item-requ_type
             versb = ls_pir_item-version
             pbdnr = ls_pir_item-req_number
             BINARY SEARCH.
    IF sy-subrc = 0.
      " 删除需要导入的行
      DELETE lt_pbim INDEX sy-tabix.

      " 修改
      CALL FUNCTION 'BAPI_REQUIREMENTS_CHANGE'
        EXPORTING
          material                 = ls_pir_item-material
          plant                    = ls_pir_item-plant
          requirementstype         = ls_pir_item-requ_type
          version                  = ls_pir_item-version
          reqmtsplannumber         = ls_pir_item-req_number
          vers_activ               = ls_pir_item-vers_activ
          do_commit                = ' '
          delete_old               = 'X'
        TABLES
          requirements_schedule_in = lt_pir_schedule_in
          return                   = lt_return.
    ELSE.
      CLEAR lt_return.
      CALL FUNCTION 'BAPI_REQUIREMENTS_CREATE'
        EXPORTING
          requirements_item        = ls_pir_item
          do_commit                = ' ' " 最后统一提交统一回滚
        TABLES
          requirements_schedule_in = lt_pir_schedule_in
          return                   = lt_return.
    ENDIF.

    " 错误消息
    LOOP AT lt_return REFERENCE INTO DATA(lr_return) WHERE type CA 'AXE'.
      <fs_head>-status = 'E'.
      <fs_head>-icon = icon_red_light.
      MESSAGE ID lr_return->id TYPE lr_return->type NUMBER lr_return->number
      WITH lr_return->message_v1 lr_return->message_v2
           lr_return->message_v3 lr_return->message_v4
      INTO DATA(l_msg).
      <fs_head>-message = |{ <fs_head>-message }{ l_msg };|.
    ENDLOOP.

    IF <fs_head>-status = 'E'.
      l_err = 'X'.
    ENDIF.
  ENDLOOP.

  " 回滚
  IF l_err = 'X'.
    CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
    RETURN.
  ENDIF.

  " 不出错的情况，全部提交
  CHECK l_err = ''.
  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
    EXPORTING
      wait = 'X'.

  " 导入成功后，通过BDC删除其他版本号
  " 不在导入前删除的原因，是为了保持数据一致性
  " （BDC无法回滚，如果BDC删除成功，后面导入失败，将无法回退到初始状态）
  " 删除的项目无法再次删除，所以也要排除
  DELETE lt_pbim WHERE loevr <> ''.

  " 通过BDC删除其余没有导入的物料数据
  LOOP AT lt_pbim REFERENCE INTO DATA(lr_pbim).
    PERFORM frm_pir_delete USING lr_pbim->matnr lr_pbim->werks lr_pbim->versb.
  ENDLOOP.

ENDFORM.                    " frm_import_pir

```

</details>
