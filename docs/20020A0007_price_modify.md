# MR21修改价格

## BDC实现

<details>
  <summary>示例代码</summary>

```ABAP

*&---------------------------------------------------------------------*
*& Form frm_bdc_mr21
*&---------------------------------------------------------------------*
*& MR21录屏
*&---------------------------------------------------------------------*
FORM frm_bdc_mr21.

  " 测试数据类型
  DATA:
    BEGIN OF ls_data,
      budat   TYPE budat,
      matnr   TYPE matnr,
      werks   TYPE werks,
      bukrs   TYPE bukrs,
      zamount TYPE p LENGTH 16 DECIMALS 2,
      mtype   TYPE bapi_mtype,
      msg     TYPE bapi_msg,
    END OF ls_data.

  " BDC数据
  DATA:
    lt_bdcdata TYPE STANDARD TABLE OF bdcdata WITH EMPTY KEY,
    ls_bdcdata TYPE bdcdata,
    lt_bdcmsg  TYPE STANDARD TABLE OF bdcmsgcoll WITH EMPTY KEY,
    ls_bdcmsg  TYPE bdcmsgcoll,
    ls_option  TYPE ctu_params.

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
    CONDENSE ls_bdcdata-fval.
    INSERT ls_bdcdata INTO TABLE lt_bdcdata.
  END-OF-DEFINITION.

  CLEAR lt_bdcdata.
  CLEAR lt_bdcmsg.
  CLEAR ls_option.

  DATA l_budat TYPE char10.
  l_budat = |{ ls_data-budat DATE = USER }|.

  " MR21初始屏幕
  _bdc_dynpro 'SAPRCKM_MR21' '0201'.
  _bdc_field:
    'BDC_OKCODE' '=ENTR',
    'MR21HEAD-BUDAT' l_budat,
    'MR21HEAD-BUKRS' ls_data-bukrs,
    'MR21HEAD-WERKS' ls_data-werks.

  " 录入一行物料价格
  _bdc_dynpro 'SAPRCKM_MR21' '0201'.
  _bdc_field:
    'BDC_OKCODE' '=ENTR',
    'CKI_MR21_0250-MATNR(01)' ls_data-matnr, " 物料
    'CKI_MR21_0250-NEWVALPR(01)' ls_data-zamount. " 价格

  " 保存
  _bdc_dynpro 'SAPRCKM_MR21' '0201'.
  _bdc_field:
    'BDC_OKCODE' '=SAVE'.

  ls_option-dismode = 'N'. " 后台
  ls_option-updmode = 'L'. " 本地
  ls_option-nobinpt = 'X'. " 有弹窗，需要启用这个标识

  CALL TRANSACTION 'MR21' USING lt_bdcdata
        OPTIONS FROM ls_option
        MESSAGES INTO lt_bdcmsg.

  " 读取错误数据
  LOOP AT lt_bdcmsg INTO ls_bdcmsg WHERE msgtyp CA 'AXE'.
    MESSAGE ID ls_bdcmsg-msgid TYPE ls_bdcmsg-msgtyp NUMBER ls_bdcmsg-msgnr
    WITH ls_bdcmsg-msgv1 ls_bdcmsg-msgv2 ls_bdcmsg-msgv3 ls_bdcmsg-msgv4
    INTO DATA(l_msg).
    ls_data-mtype = 'E'.
    ls_data-msg = |{ ls_data-msg }{ l_msg };|.
  ENDLOOP.
  IF sy-subrc <> 0.
    " 没有错误，将正确数据报出
    DELETE lt_bdcmsg WHERE msgtyp CA 'AXE'.
    LOOP AT lt_bdcmsg INTO ls_bdcmsg.
      MESSAGE ID ls_bdcmsg-msgid TYPE ls_bdcmsg-msgtyp NUMBER ls_bdcmsg-msgnr
      WITH ls_bdcmsg-msgv1 ls_bdcmsg-msgv2 ls_bdcmsg-msgv3 ls_bdcmsg-msgv4
      INTO l_msg.
      ls_data-mtype = 'S'.
      ls_data-msg = |{ ls_data-msg }{ l_msg };|.
    ENDLOOP.
  ENDIF.

  IF ls_data-msg IS INITIAL.
    ls_data-mtype = 'S'.
    ls_data-msg = '已处理'.
  ENDIF.

  " 不管如何，BDC都回滚不了，直接提交了事
  COMMIT WORK AND WAIT.

ENDFORM.

```

</details>

## BAPI实现

***BAPI_M_REVAL_CREATEPRICECHANGE***，价格修改用BAPI，由于将该函数代码初始有默认限制，需要通过增强放开。

> 增强BAPI不知道会留下什么坑……所以我没用BAPI实现价格修改，也没有示例
