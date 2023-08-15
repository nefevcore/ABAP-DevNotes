# SMARTFORMS相关

<details>
  <summary>示例代码</summary>

```ABAP

*&---------------------------------------------------------------------*
*& Form frm_pinrt
*&---------------------------------------------------------------------*
*& 打印
*&---------------------------------------------------------------------*
FORM frm_pinrt .

  DATA l_formname TYPE tdsfname VALUE 'ZNAME'.
  DATA l_fm_name TYPE rs38l_fnam.

  " 获取打印函数
  CALL FUNCTION 'SSF_FUNCTION_MODULE_NAME'
    EXPORTING
      formname           = l_formname
    IMPORTING
      fm_name            = l_fm_name
    EXCEPTIONS
      no_form            = 1
      no_function_module = 2
      OTHERS             = 3.
  IF sy-subrc <> 0.
    MESSAGE ID sy-msgid TYPE 'S' NUMBER sy-msgno DISPLAY LIKE 'E'
        WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
    RETURN.
  ENDIF.

  " 设置控制参数
  DATA ls_control_parameters TYPE ssfctrlop.
  DATA ls_output_options TYPE ssfcompop.

  CLEAR ls_control_parameters.
  CLEAR ls_output_options.

  ls_control_parameters-no_open = abap_true.
  ls_control_parameters-no_close = abap_true.

  " 准备打印
  CALL FUNCTION 'SSF_OPEN'
    EXPORTING
      output_options     = ls_output_options
      control_parameters = ls_control_parameters
    EXCEPTIONS
      formatting_error   = 1
      internal_error     = 2
      send_error         = 3
      user_canceled      = 4
      OTHERS             = 5.
  IF sy-subrc <> 0.
    MESSAGE ID sy-msgid TYPE 'S' NUMBER sy-msgno DISPLAY LIKE 'E'
        WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
    RETURN.
  ENDIF.

  " 分组打印
  LOOP AT gt_data INTO DATA(ls_data) WHERE zsel = abap_true
    GROUP BY (
      zkey = ls_data-zkey
    ) INTO DATA(ls_data_grp).

    DATA ls_print TYPE zprint.
    CLEAR ls_print.

    " 补空行
    DATA l_line_per_page TYPE i VALUE 10.
    WHILE ( lines( ls_print-t_item ) MOD l_line_per_page ) <> 0.
      INSERT INITIAL LINE INTO TABLE ls_print-t_item.
    ENDWHILE.

    " 打印
    CALL FUNCTION l_fm_name
      EXPORTING
        control_parameters = ls_control_parameters
        output_options     = ls_output_options
        i_data             = ls_print
      EXCEPTIONS
        formatting_error   = 1
        internal_error     = 2
        send_error         = 3
        user_canceled      = 4
        OTHERS             = 5.
    IF sy-subrc <> 0.
      MESSAGE ID sy-msgid TYPE 'S' NUMBER sy-msgno DISPLAY LIKE 'E'
          WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
      RETURN.
    ENDIF.

  ENDLOOP.

  " 关闭打印
  CALL FUNCTION 'SSF_CLOSE'
    EXCEPTIONS
      formatting_error = 1
      internal_error   = 2
      send_error       = 3
      OTHERS           = 4.
  IF sy-subrc <> 0.
    MESSAGE ID sy-msgid TYPE 'S' NUMBER sy-msgno DISPLAY LIKE 'E'
        WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
    RETURN.
  ENDIF.

ENDFORM.

```

</details>

## 取消激活WORD编辑器

WORD编辑器没办法拖拽字段，需要换回文本编辑器。

1. SE38运行程序RSCPSETEDITOR，取消勾选并激活。

2. CL_COS_UTILITIES=>IS_S4H增强加入下面代码

    ```ABAP

    IF sy-tcode = 'SMARTFORMS'.
        rv_is_s4h = abap_false.
    ENDIF.

    ```

## 打印PDF

和普通打印没太大区别，多设置几个参数即可

<details>
  <summary>示例代码</summary>

```ABAP

" ...

" 获取OTF内容
ls_control_parameters-getotf = abap_true.
" 设置打印机
ls_output_options-tddest = 'LP01'.

" ...

" 调用打印的函数，通过JOB_OUTPUT_INFO获取OTF内容
DATA ls_job_output_info TYPE ssfcrescl.
CALL FUNCTION l_fm_name
  EXPORTING
    control_parameters = ls_control_parameters
    output_options     = ls_output_options
  IMPORTING
    job_output_options = ls_job_options
    job_output_info    = ls_job_output_info
  EXCEPTIONS
    formatting_error   = 1
    internal_error     = 2
    send_error         = 3
    user_canceled      = 4
    OTHERS             = 5.

" PDF的形式保存打印单
DATA l_len TYPE i.
DATA l_xstr TYPE xstring.
DATA lt_lines TYPE STANDARD TABLE OF tline.
CALL FUNCTION 'CONVERT_OTF'
  EXPORTING
    format                = 'PDF'
  IMPORTING
    bin_filesize          = l_len
    bin_file              = l_xstr
  TABLES
    otf                   = ls_job_output_info-otfdata[]
    lines                 = lt_lines
  EXCEPTIONS
    err_max_linewidth     = 1
    err_format            = 2
    err_conv_not_possible = 3
    err_bad_otf           = 4
    OTHERS                = 5.
IF sy-subrc <> 0.
  MESSAGE ID sy-msgid TYPE 'S' NUMBER sy-msgno DISPLAY LIKE 'E'
      WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
  RETURN.
ENDIF.

cl_openxml_helper=>store_local_file( im_file_name = 'C:\Export.pdf'
                                     im_data = l_xstr ).

" ...

```

</details>
