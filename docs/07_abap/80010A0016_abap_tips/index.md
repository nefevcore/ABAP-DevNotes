# ABAP开发小知识

## **嵌套循环优化**

排序后通过二分法查找起始位置，然后循环并加入退出判断

<details>
  <summary>示例代码</summary>

```ABAP

TYPES:
  BEGIN OF ty_data,
    field1 TYPE string,
    field2 TYPE string,
  END OF ty_data.

DATA:
  lt_head TYPE STANDARD TABLE OF ty_data,
  ls_head TYPE ty_data,
  lt_item TYPE STANDARD TABLE OF ty_data,
  ls_item TYPE ty_data.

SORT lt_item BY field1 field2.

LOOP AT lt_head INTO ls_head.
  " ABAP中的二分查找，会找到重复项的首项
  READ TABLE lt_item TRANSPORTING NO FIELDS WITH KEY field1 = ls_head-field1 BINARY SEARCH.
  IF sy-subrc = 0.
    LOOP AT lt_item INTO ls_item FROM sy-tabix.
      IF ls_item-field1 <> ls_head-field1.
        EXIT.
      ENDIF.
      " write something...
    ENDLOOP.
  ENDIF.
ENDLOOP.

```

</details>

## **获取报表数据**

<details>
  <summary>通过类CL_SALV_BS_RUNTIME_INFO获取OOALV报表数据</summary>

```ABAP

  data lr_data type ref to data.
  field-symbols <fs_table> type standard table.
  
  " 获取设置
  call method cl_salv_bs_runtime_info=>set
    exporting
      display  = abap_false
      metadata = abap_false
      data     = abap_true .

  " 运行目标程序
  submit zreport and return.

  try.
    " 获取报表内容
    cl_salv_bs_runtime_info=>get_data_ref(
      importing
        r_data = lr_data ).
    assign lr_data->* to <fs_table>.
  catch cx_salv_bs_sc_runtime_info.
    message `Unable to retrieve ALV data` type 'E'.
  endtry.

  " 清空内存数据
  cl_salv_bs_runtime_info=>clear_all( ). 

```

</details>

<details>
  <summary>通过LIST_TO_MEMORY，获取LIST报表</summary>

```ABAP

SUBMIT zreport EXPORTING LIST TO MEMORY AND RETURN. 

DATA lt_list TYPE TABLE OF abaplist.
CALL FUNCTION 'LIST_FROM_MEMORY' 
  TABLES 
    listobject = lt_list
  EXCEPTIONS 
    not_found  = 1 
    OTHERS     = 2. 

```

</details>

## **邮件发送**

<details>
    <summary>邮件发送代码</summary>

```ABAP

DATA: send_request TYPE REF TO cl_bcs,
    document     TYPE REF TO cl_document_bcs,
    fail         TYPE REF TO cx_bcs,
    recipient    TYPE REF TO if_recipient_bcs.

DATA: ls        TYPE string,
    mailto    TYPE ad_smtpadr,
    main_text TYPE bcsy_text,
    title     TYPE so_obj_des.

ls = '该邮件用于测试演示程序'.

APPEND ls TO main_text.
title = '邮件发送测试'.
mailto = 'xxx@xxx.xx'.

TRY.
    " 创建发送请求
    send_request = cl_bcs=>create_persistent( ).
    " 创建整理发送内容
    document = cl_document_bcs=>create_document(
        i_type = 'RAW'
        i_text = main_text
        i_subject = title ).
    " 添加邮件内容到发送请求
    send_request->set_document( document ).
    " 邮件地址转换
    recipient = cl_cam_address_bcs=>create_internet_address( mailto ).
    " 添加邮件地址到发送请求
    send_request->add_recipient( recipient ).
    " 正式发送并提交作业
    send_request->send( i_with_error_screen = 'X' ).
    COMMIT WORK AND WAIT.

CATCH cx_bcs INTO fail.
ENDTRY.

```

</details>

## **获取PO访问账户**

<details>
  <summary>示例代码</summary>

```ABAP

" 获取外围系统访问PO的账户
" （不知道有没有更简单的取法，不想找了）
TRY.
    DATA(lo_context) = cl_proxy_access=>get_server_context( ).
    "
    DATA lo_protocol_internal TYPE REF TO if_wsprotocol_internal.
    lo_protocol_internal ?= lo_context->get_protocol( |{ 'INTERNAL'(int) }| ).
    "
    DATA lo_framework TYPE REF TO if_proxy_framework_xi.
    lo_framework ?= lo_protocol_internal->get_framework( ).
    "
    DATA lo_xms_message TYPE REF TO if_xms_message.
    lo_xms_message ?= lo_framework->xmb_message.
    "
    DATA lo_xms_msghdr30_dynamic TYPE REF TO if_xms_msghdr30_dynamic.
    lo_xms_msghdr30_dynamic ?= lo_xms_message->getheaderbyname(
      nsuri  = |{ 'http://sap.com/xi/XI/Message/30'(xi3) }|
      lcname = |{ 'DynamicConfiguration'(dcf) }| ).
    " 该项目都是REST类型，所以写死了
    " 如果有其他接口类型，如SOAP，换下namespace应该也行得通
    DATA(lo_record) = lo_xms_msghdr30_dynamic->get_record(
      im_namespace = |{ 'http://sap.com/xi/XI/System/REST'(rst) }|
      im_name      = |{ 'Remote_User'(rtu) }|
    ).
  CATCH cx_root.
    RETURN.
ENDTRY.

r_po_user = lo_record-param_value.


```

</details>

## **缓存响应数据**

项目上看到有人用这种方法，实现PDF在线预览：

<details>
  <summary>示例代码</summary>

```ABAP

    "  ev_xstring = lv_pdf_xstring.
    CREATE OBJECT lo_cached_response TYPE cl_http_response
      EXPORTING
        add_c_msg = 1.

    " set the data and the headers
    lo_cached_response->set_data( lv_pdf_xstring ).
    lv_app_type = cns_type.
    lo_cached_response->set_header_field( name  = if_http_header_fields=>content_type
                                          value = lv_app_type ).
    " Set the Response Status
    lo_cached_response->set_status( code = 200 reason = cns_ok ).
    " Set the Cache Timeout - 60 seconds - we only need this in the cache long enough to build the page
    lo_cached_response->server_cache_expire_rel( expires_rel = 60 ).
    " Create a unique URL for the object and export URL
    CALL FUNCTION 'GUID_CREATE'
      IMPORTING
        ev_guid_32 = lv_guid.
    CONCATENATE  TEXT-t01 TEXT-t02 lv_guid cns_dot cns_pdf INTO c_url.

    " Cache the URL
    cl_http_server=>server_cache_upload( url      = c_url
                                         response = lo_cached_response ).

```

</details>

## **通过Update Task调整自开发代码更新顺序**

实际项目上，增强内由于凭证尚未生成，如果立即查询底表会导致失败，因此通过Update Task的方式，将更新滞后到标准保存后，从而能正确获取底表数据

## **捕获RFC异常**

<details open>
  <summary>示例代码</summary>

```ABAP

" 调用RFC
CALL FUNCTION '' DESTINATION i_dest

" 通讯错误
    EXCEPTIONS
      system_failure        = 1000  MESSAGE e_message
      communication_failure = 1001  MESSAGE e_message
      OTHERS                = 1002.

" 异常错误
    EXCEPTIONS
      error_message     = 98
      OTHERS            = 98.

```

</details>

## **更新Where-use list**

程序：SAPRSEUB ，跑得特别慢，建议后台处理
