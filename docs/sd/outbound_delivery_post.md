# 发货过账

## VL09N发货过账

由于全局参数缓存问题，建议新建程序进行处理。

<details>
  <summary>示例代码</summary>

```ABAP

*&---------------------------------------------------------------------*
*& Report Z_GTM_RPT_0095_VL_VL09
*&---------------------------------------------------------------------*
*&
*&---------------------------------------------------------------------*
REPORT z_gtm_rpt_0095_vl_vl09.

PARAMETERS p_vbeln TYPE likp-vbeln.
PARAMETERS p_mid TYPE char20 NO-DISPLAY.

AT SELECTION-SCREEN.
  PERFORM frm_vl09.

*&---------------------------------------------------------------------*
*& Form frm_vl09
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
*& -->  p1        text
*& <--  p2        text
*&---------------------------------------------------------------------*
FORM frm_vl09 .

  DATA es_emkpf TYPE emkpf.
  DATA t_mesg   TYPE STANDARD TABLE OF mesg.

  SELECT SINGLE
    wadat_ist ,
    vbtyp
    FROM likp
    WHERE vbeln = @p_vbeln
    INTO @DATA(ls_likp).

  SET PARAMETER ID 'BAPI_TCODE' FIELD 'VL09'.

  " 这BUG有点难受，如果连续冲销交货单，会导致第二次操作失败
  " 因此通过切换程序来重置这个过程
  CALL FUNCTION 'WS_REVERSE_GOODS_ISSUE'
    EXPORTING
      i_vbeln                   = p_vbeln
      i_budat                   = sy-datum
      i_tcode                   = 'VL09'
      i_vbtyp                   = ls_likp-vbtyp
    IMPORTING
      es_emkpf                  = es_emkpf
    TABLES
      t_mesg                    = t_mesg
    EXCEPTIONS
      error_reverse_goods_issue = 1
      OTHERS                    = 2.
  IF sy-subrc <> 0.
* Implement suitable error handling here
  ENDIF.

  SET PARAMETER ID 'BAPI_TCODE' FIELD ''.

  IF es_emkpf-mblnr IS NOT INITIAL.
    CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
      EXPORTING
        wait = abap_true.
  ELSE.
    CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
  ENDIF.

  " 返回执行结果
  IF p_mid IS NOT INITIAL.
    EXPORT
      es_emkpf = es_emkpf
      t_mesg = t_mesg
    TO MEMORY ID p_mid.
  ENDIF.

ENDFORM.

```

</details>
