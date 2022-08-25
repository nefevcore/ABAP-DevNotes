# 工单关闭

## 技术性完成（TECO）生产订单

<details>
<summary>示例代码</summary>

```ABAP

DATA:
  lt_orders        TYPE STANDARD TABLE OF bapi_order_key,
  lt_detail_return TYPE STANDARD TABLE OF bapi_order_return,
  ls_return        TYPE bapiret2.

CLEAR lt_orders.
CLEAR lt_detail_return.
CLEAR ls_return.

INSERT VALUE #( order_number = ls_input-aufnr ) INTO TABLE lt_orders.

" 技术性完成生产订单
CALL FUNCTION 'BAPI_PRODORD_COMPLETE_TECH'
  IMPORTING
    return        = ls_return
  TABLES
    orders        = lt_orders
    detail_return = lt_detail_return.

IF ls_return-type = 'E'.
  l_mtype = 'E'.
  MESSAGE ID ls_return-id TYPE ls_return-type NUMBER ls_return-number
    WITH ls_return-message_v1 ls_return-message_v2 ls_return-message_v3 ls_return-message_v4
    INTO l_msg.
  CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
ELSE.
  l_mtype = 'S'.
  l_msg = |已处理|.
  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
    EXPORTING
      wait = 'X'.
ENDIF.

```

</details>

## 撤销TECO

用方法STATUS_CHANGE_INTERN撤销TECO，但是无法清除AUFK-IDAT2技术完成日期，或许可以直接改表来去除这个字段信息?

<details>
  <summary>示例代码</summary>

```ABAP

  DATA lt_jstat TYPE STANDARD TABLE OF jstat WITH EMPTY KEY.
  CLEAR lt_jstat.
  CALL FUNCTION 'STATUS_READ'
    EXPORTING
      objnr            = i_objnr
    TABLES
      status           = lt_jstat
    EXCEPTIONS
      object_not_found = 1
      OTHERS           = 2.
  IF sy-subrc = 0.
* Implement suitable error handling here
    LOOP AT lt_jstat REFERENCE INTO DATA(lr_jstat).
      CASE lr_jstat->stat.
        WHEN 'I0002'. " REL
          lr_jstat->inact = ''.
        WHEN 'I0045'. " TECO
          lr_jstat->inact = 'X'.
        WHEN OTHERS.
      ENDCASE.
    ENDLOOP.

    CALL FUNCTION 'STATUS_CHANGE_INTERN'
      EXPORTING
        objnr               = i_objnr
      TABLES
        status              = lt_jstat
      EXCEPTIONS
        object_not_found    = 1
        status_inconsistent = 2
        status_not_allowed  = 3
        OTHERS              = 4.
    IF sy-subrc <> 0.
* Implement suitable error handling here
    ENDIF.
  ENDIF.

```

</details>

## 撤销TECO（BDC实现）

<details>
  <summary>示例代码</summary>

```ABAP

FORM frm_bdc_status_change USING i_aufnr TYPE aufk-aufnr
                                 i_teco TYPE xflag
                        CHANGING c_subrc TYPE sy-subrc.
  DATA lt_bdcdata TYPE STANDARD TABLE OF bdcdata WITH EMPTY KEY.
  DEFINE _bdc_dynpro.
    append value #(
      program = &1
      dynpro = &2
      dynbegin = 'X'
    ) to lt_bdcdata.
  END-OF-DEFINITION.
  DEFINE _bdc_field.
    append value #(
      fnam = &1
      fval = &2
    ) to lt_bdcdata.
  END-OF-DEFINITION.

  " CO02首页，选择总览，输入订单号，ENTER进入
  _bdc_dynpro 'SAPLCOKO1' '0110'.
  _bdc_field:
    'BDC_OKCODE' '/00',
    'R62CLORD-FLG_OVIEW' 'X',
    'CAUFVD-AUFNR' i_aufnr.

  " =TABS:  TECO 技术性关闭
  " =TABR:  undo TECO 取消技术性关闭
  _bdc_dynpro 'SAPLCOKO1' '0115'.
  IF i_teco = 'X'.
    _bdc_field 'BDC_OKCODE' '=TABS'.
  ELSE.
    _bdc_field 'BDC_OKCODE' '=TABR'.
  ENDIF.

  " 保存
  _bdc_dynpro 'SAPLCOKO1' '0115'.
  _bdc_field 'BDC_OKCODE' '=BU'.

  " 保存时弹窗选择“是”
  _bdc_dynpro 'SAPLSPO1' '0300'.
  _bdc_field 'BDC_OKCODE' '=YES'.


  DATA ls_option TYPE ctu_params.
  ls_option-dismode = 'N'. " 后台
  ls_option-updmode = 'L'. " 本地
  ls_option-nobinpt = 'X'. " 有弹窗，需要启用这个标识

  DATA lt_message TYPE STANDARD TABLE OF bdcmsgcoll WITH EMPTY KEY.

  CALL TRANSACTION 'CO02' USING lt_bdcdata
        OPTIONS FROM ls_option
        MESSAGES INTO lt_message.
  " 不管如何，BDC都回滚不了，直接提交了事
  COMMIT WORK AND WAIT.
ENDFORM.                    " frm_bdc_status_change

```

</details>
