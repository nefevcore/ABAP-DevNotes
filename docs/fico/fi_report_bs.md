# 资产负债表

资产负债表是[财务取值模块](/fico/fi_report/)的一个实例。下面代码使用的配置表可参考[页面](/fico/fi_report/fi_report_config/)。

<details>
  <summary>示例代码</summary>

```ABAP

REPORT zfi_balance.

*&---------------------------------------------------------------------*
*& Include zfi_balance_top
*&---------------------------------------------------------------------*
TYPES:
  BEGIN OF ty_data,
    bukrs  TYPE bukrs,
    gjahr  TYPE gjahr,
    monat  TYPE monat,
    field1 TYPE string, " 资产
    field2 TYPE string, " 行次
    field3 TYPE string, " 期末余额
    field4 TYPE string, " 年初余额
    field5 TYPE string, " 负债和所有者权益
    field6 TYPE string, " 行次
    field7 TYPE string, " 期末余额
    field8 TYPE string, " 年初余额
  END OF ty_data.
TYPES tt_data TYPE STANDARD TABLE OF ty_data.
DATA gt_data TYPE tt_data.

DATA gt_bukrs TYPE STANDARD TABLE OF bukrs WITH EMPTY KEY.

*&---------------------------------------------------------------------*
*& Include zfi_balance_sel
*&---------------------------------------------------------------------*
TABLES t001.
SELECT-OPTIONS s_bukrs FOR t001-bukrs NO-EXTENSION NO INTERVALS OBLIGATORY.
PARAMETERS p_gjahr TYPE gjahr OBLIGATORY DEFAULT sy-datum(4).
PARAMETERS p_monat TYPE monat OBLIGATORY DEFAULT sy-datum+4(2).

*&---------------------------------------------------------------------*
*& Include zfir001_frm
*&---------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*& Form frm_main
*&---------------------------------------------------------------------*
*& 报表程序入口
*&---------------------------------------------------------------------*
FORM frm_main .

  PERFORM frm_auth_check.
  IF gt_bukrs IS INITIAL.
    RETURN.
  ENDIF.

  PERFORM frm_gen_balance_sheet. " 资产负债表
  PERFORM frm_display TABLES gt_data. " 展示

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_auth_check
*&---------------------------------------------------------------------*
*& 权限检查
*&---------------------------------------------------------------------*
FORM frm_auth_check.

  DATA lt_bukrs_opt TYPE RANGE OF bukrs.
  SELECT
    'I' AS sign,
    'EQ' AS option,
    bukrs AS low
    FROM t001
    WHERE bukrs IN @s_bukrs
    INTO TABLE @lt_bukrs_opt.
  IF lt_bukrs_opt IS INITIAL.
    l_subrc = 1.
    l_msg = |公司不存在|.
  ENDIF.

  SORT lt_bukrs_opt.
  DELETE ADJACENT DUPLICATES FROM lt_bukrs_opt COMPARING ALL FIELDS.

  LOOP AT lt_bukrs_opt INTO DATA(ls_bukrs_opt).
    AUTHORITY-CHECK OBJECT 'F_BKPF_BUK'
      ID 'BUKRS' FIELD ls_bukrs_opt-low
      ID 'ACTVT' FIELD i_actvt.
    IF sy-subrc <> 0.
      MESSAGE |无公司{ ls_bukrs_opt-low }权限| TYPE 'S' DISPLAY LIKE 'E'.
      DELETE lt_bukrs_opt.
    ENDIF.
  ENDLOOP.

  s_bukrs[] = lt_bukrs_opt.
  IF s_bukrs[] IS INITIAL.
    LEAVE LIST-PROCESSING.
  ENDIF.

  SELECT bukrs FROM t001 WHERE bukrs IN @s_bukrs INTO TABLE @gt_bukrs.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_config
*&---------------------------------------------------------------------*
*& 读取全部公司配置
*&---------------------------------------------------------------------*
FORM frm_get_config_all TABLES et_config TYPE tt_config.

  DATA lt_config TYPE tt_config.
  LOOP AT gt_bukrs INTO DATA(l_bukrs).
    PERFORM frm_get_config TABLES lt_config
                           USING '1' " 资产负债表
                                 l_bukrs.
    INSERT LINES OF lt_config INTO TABLE et_config.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_config
*&---------------------------------------------------------------------*
*& 读取单个公司配置
*&---------------------------------------------------------------------*
FORM frm_get_config TABLES et_config TYPE tt_config
                    USING i_fi_report TYPE string
                          i_bukrs TYPE bukrs.

  " 考虑适配符
  DATA lt_bukrs_opt TYPE RANGE OF bukrs.
  lt_bukrs_opt = VALUE #( sign = 'I' option = 'EQ'
    ( low = i_bukrs )
    ( low = |{ i_bukrs(3) }*| )
    ( low = |{ i_bukrs(2) }*| )
    ( low = |{ i_bukrs(1) }*| )
    ( low = '*' )
    ( low = '' )
  ).

  " 取配置数据
  SELECT *
    FROM zfit0001
    WHERE zfi_report = @i_fi_report
      AND bukrs IN @lt_bukrs_opt
    INTO TABLE @DATA(lt_zfit0001).

  " 解析配置数据
  LOOP AT lt_zfit0001 INTO DATA(ls_zfit0001).
    DATA ls_config TYPE ty_config.
    CLEAR ls_config.

    ls_config-bukrs = ls_zfit0001-bukrs. " 公司
    ls_config-zitem = ls_zfit0001-zitem. " 项目
    ls_config-zitem_sub = ls_zfit0001-zitem_sub. " 子项目

    CASE ls_zfit0001-ztype.
      WHEN '0'. " 文本项
        ls_config-ztext = ls_zfit0001-ztext. " 项目名称

      WHEN '1'. " 筛选项
        " 科目
        IF ls_zfit0001-racct_to IS NOT INITIAL.
          INSERT VALUE #( sign = 'I' option = 'BT'
            low = ls_zfit0001-racct_from
            high = ls_zfit0001-racct_to
          ) INTO TABLE ls_config-t_racct_opt.
        ELSE.
          INSERT VALUE #( sign = 'I' option = 'EQ'
            low = ls_zfit0001-racct_from
          ) INTO TABLE ls_config-t_racct_opt.
        ENDIF.

        " 原因代码
        INSERT VALUE #(
          name = 'RSTGR' " TY_DATEIL字段名，后续动态筛选
          t_range_opt = VALUE #( ( sign = 'I' option = 'EQ' low = ls_zfit0001-rstgr ) )
        ) INTO TABLE ls_config-t_filter.

        " 功能范围
        INSERT VALUE #(
          name = 'RFAREA' " TY_DATEIL字段名，后续动态筛选
          t_range_opt = VALUE #( ( sign = 'I' option = 'EQ' low = ls_zfit0001-rfarea ) )
        ) INTO TABLE ls_config-t_filter.

      WHEN '2'. " 汇总项
        IF ls_zfit0001-zitem_to IS INITIAL OR ls_zfit0001-zitem_to = ''.
          ls_zfit0001-zitem_to = ls_zfit0001-zitem_from.
        ENDIF.
        WHILE ls_zfit0001-zitem_from <= ls_zfit0001-zitem_to.
          INSERT ls_zfit0001-zitem_from INTO TABLE ls_config-t_collect.
          ls_zfit0001-zitem_from = ls_zfit0001-zitem_from + 1.
        ENDWHILE.
        ls_config-zreverse = ls_zfit0001-zreverse. " 反向标识

      WHEN OTHERS.
    ENDCASE. " CASE ls_zfit0001-ztype

    INSERT ls_config INTO TABLE et_config.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_gen_balance_sheet
*&---------------------------------------------------------------------*
*& 生成资产负债表
*&---------------------------------------------------------------------*
FORM frm_gen_balance_sheet.

  DATA lt_config TYPE tt_config.
  PERFORM frm_get_config_all TABLES lt_config. " 获取配置数据

  " 根据配置数据生成财务报表数据项
  DATA(lt_fi_data) = lcl_fi_report=>create(
                       i_year    = p_gjahr
                       i_period  = p_monat
                       it_config = lt_config
                     )->execute( ).
  SORT lt_fi_data BY bukrs year period zitem.

  " 找到资产总计行，用于划分两列
  DATA l_lines TYPE i.
  LOOP AT lt_fi_data REFERENCE INTO DATA(lr_fi_data).
    l_lines = sy-tabix.
    IF lr_fi_data->ztext CS '资产总计'.
      EXIT.
    ENDIF.
  ENDLOOP.

  DATA lt_data TYPE tt_data.
  DATA ls_data TYPE ty_data.

  LOOP AT gt_bukrs INTO DATA(l_bukrs).
    CLEAR lt_data.
    DO l_lines TIMES.
      CLEAR ls_data.
      ls_data-bukrs = l_bukrs.
      ls_data-gjahr = p_gjahr.
      ls_data-monat = p_monat.

      ls_data-field2 = sy-index. " 资产列行次
      READ TABLE lt_fi_data REFERENCE INTO lr_fi_data WITH KEY
      bukrs = l_bukrs
      year = p_gjahr
      period = p_monat
      zitem = ls_data-field2
      BINARY SEARCH.
      IF sy-subrc = 0.
        ls_data-field1 = lr_fi_data->ztext.
        ls_data-field3 = |{ lr_fi_data->period_total NUMBER = USER DECIMALS = 2 }|.
        ls_data-field4 = |{ lr_fi_data->year_begin NUMBER = USER DECIMALS = 2 }|.
      ENDIF.

      ls_data-field6 = sy-index + l_lines. " 负债和所有者权益列行次
      READ TABLE lt_fi_data REFERENCE INTO lr_fi_data WITH KEY
      bukrs = l_bukrs
      year = p_gjahr
      period = p_monat
      zitem = ls_data-field6
      BINARY SEARCH.
      IF sy-subrc = 0.
        ls_data-field5 = lr_fi_data->ztext.
        ls_data-field7 = |{ lr_fi_data->period_total NUMBER = USER DECIMALS = 2 }|.
        ls_data-field8 = |{ lr_fi_data->year_begin NUMBER = USER DECIMALS = 2 }|.
      ENDIF.

      INSERT ls_data INTO TABLE gt_data.
    ENDDO.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_export
*&---------------------------------------------------------------------*
*& 导出到本地
*&---------------------------------------------------------------------*
FORM frm_export.

  TYPES:
    BEGIN OF ty_replace,
      from TYPE string,
      to   TYPE string,
    END OF ty_replace.
  TYPES tt_replace TYPE STANDARD TABLE OF ty_replace WITH EMPTY KEY.
  DATA lt_replace TYPE tt_replace.
  DATA ls_replace TYPE ty_replace.

  " 获取下载目录
  DATA l_directory TYPE string.
  cl_gui_frontend_services=>directory_browse(
    CHANGING
      selected_folder      = l_directory
    EXCEPTIONS
      cntl_error           = 1
      error_no_gui         = 2
      not_supported_by_gui = 3
  ).
  IF sy-subrc <> 0.
    MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
      WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
  ENDIF.

  DATA(l_buffer) = lcl_fi_report=>get_smw0_templete( CONV #( sy-tcode ) ). " 获取SMW0模板文件
  CHECK l_buffer IS NOT INITIAL.

  " 逐公司处理
  LOOP AT gt_data INTO DATA(ls_data)
    GROUP BY (
      bukrs = ls_data-bukrs
      gjahr = ls_data-gjahr
      monat = ls_data-monat
    ) INTO DATA(ls_data_grp).

    SELECT SINGLE butxt FROM t001 WHETE bukrs = @ls_data_grp-bukrs INTO @DATA(l_butxt).

    " 编制单位
    CLEAR ls_replace.
    ls_replace-from = |__BUKRS__|.
    ls_replace-to = l_butxt.
    INSERT ls_replace INTO TABLE lt_replace.

    " 打印日期
    CLEAR ls_replace.
    ls_replace-from = |__ZDATE__|.
    ls_replace-to = |{ sy-datum(4) }年{ sy-datum+4(2) }月{ sy-datum+6(2) }日|.
    INSERT ls_replace INTO TABLE lt_replace.

    LOOP AT GROUP ls_data_grp INTO ls_data.
      " 资产-期末余额
      CLEAR ls_replace.
      ls_replace-from = |__PEROID_END_Z{ ls_data-field2 }__|.
      ls_replace-to = ls_data-field3.
      INSERT ls_replace INTO TABLE lt_replace.

      " 资产-年初余额
      CLEAR ls_replace.
      ls_replace-from = |__YEAR_BEGIN_Z{ ls_data-field2 }__|.
      ls_replace-to = ls_data-field4.
      INSERT ls_replace INTO TABLE lt_replace.

      " 损益-期末余额
      CLEAR ls_replace.
      ls_replace-from = |__PEROID_END_Z{ ls_data-field6 }__|.
      ls_replace-to = ls_data-field7.
      INSERT ls_replace INTO TABLE lt_replace.

      " 损益-年初余额
      CLEAR ls_replace.
      ls_replace-from = |__YEAR_BEGIN_Z{ ls_data-field6 }__|.
      ls_replace-to = ls_data-field8.
      INSERT ls_replace INTO TABLE lt_replace.
    ENDLOOP.

    " 替换文本内容
    DATA(l_doc) = l_buffer.
    lcl_fi_report=>replace_texts(
      EXPORTING
        it_replace = lt_replace
      CHANGING
        c_doc      = l_doc
    ).
    CHECK l_doc IS NOT INITIAL.

    " 下载到本地
    TRY.
        DATA(l_filename) = |{ l_directory }\\资产负债表_{ l_bukrs_name }_{ sy-datum }.xlsx|.
        cl_openxml_helper=>store_local_file( im_file_name = l_filename
                                             im_data = l_doc ).
      CATCH cx_openxml_not_found
            cx_openxml_format
            cx_openxml_not_allowed
            INTO DATA(lx_openxml).
        MESSAGE lx_openxml->get_text( ) TYPE 'S' DISPLAY LIKE 'E'.
        RETURN.
    ENDTRY.

  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Include zfi_balance_alv
*&---------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*& Form frm_display
*&---------------------------------------------------------------------*
*& ALV展示
*&---------------------------------------------------------------------*
FORM frm_display TABLES ct_data TYPE STANDARD TABLE.

  DATA ls_layout TYPE lvc_s_layo.
  DATA lt_fieldcat TYPE STANDARD TABLE OF lvc_s_fcat.

  PERFORM frm_set_layout CHANGING ls_layout.
  PERFORM frm_set_fieldcat TABLES lt_fieldcat.

  CALL FUNCTION 'REUSE_ALV_GRID_DISPLAY_LVC'
    EXPORTING
      i_callback_program       = sy-repid
*      i_callback_pf_status_set = 'FRM_PF_STATUS'
*      i_callback_user_command  = 'FRM_USER_COMMAND'
      is_layout_lvc            = ls_layout
      it_fieldcat_lvc          = lt_fieldcat
      i_default                = abap_true
      i_save                   = 'A'
    TABLES
      t_outtab                 = ct_data[]
    EXCEPTIONS
      program_error            = 1
      OTHERS                   = 2.
  IF sy-subrc <> 0.
    MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
    WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_layout
*&---------------------------------------------------------------------*
*& 报表布局设置
*&---------------------------------------------------------------------*
FORM frm_set_layout CHANGING cs_layout TYPE lvc_s_layo.

  CLEAR cs_layout.
  cs_layout-zebra = abap_true. " 斑马线
  cs_layout-cwidth_opt = abap_true. " 自动调整ALVL列宽
  cs_layout-sel_mode = 'A'. " 选择模式
*  cs_layout-ctab_fname = 'COLTAB'. " 单元格颜色设置

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_fieldcat
*&---------------------------------------------------------------------*
*& 字段目录设置
*&---------------------------------------------------------------------*
FORM frm_set_fieldcat TABLES ct_fieldcat TYPE lvc_t_fcat.

  DATA ls_fieldcat TYPE lvc_s_fcat.

  DEFINE _init_fieldcat.
    CLEAR ls_fieldcat.
    ls_fieldcat-fieldname = &1.
    ls_fieldcat-tooltip =
    ls_fieldcat-coltext =
    ls_fieldcat-seltext =
    ls_fieldcat-scrtext_l =
    ls_fieldcat-scrtext_m =
    ls_fieldcat-scrtext_s = &2.
    ls_fieldcat-ref_table = &3.
    ls_fieldcat-ref_field = &4.
    INSERT ls_fieldcat INTO TABLE ct_fieldcat.
  END-OF-DEFINITION.

  _init_fieldcat 'FIELD1' '资产' '' ''.
  _init_fieldcat 'FIELD2' '行次' '' ''.
  _init_fieldcat 'FIELD3' '期末余额' '' ''.
  _init_fieldcat 'FIELD4' '年初余额' '' ''.
  _init_fieldcat 'FIELD5' '负债和所有者权益' '' ''.
  _init_fieldcat 'FIELD6' '行次' '' ''.
  _init_fieldcat 'FIELD7' '期末余额' '' ''.
  _init_fieldcat 'FIELD8' '年初余额' '' ''.

  " 个性化自己输出数据格式
  LOOP AT ct_fieldcat REFERENCE INTO DATA(lr_fieldcat).
    " 字段显示属性设置
    CASE lr_fieldcat->fieldname .
      WHEN OTHERS.
    ENDCASE.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_pf_status
*&---------------------------------------------------------------------*
*& 设置GUI状态
*&---------------------------------------------------------------------*
FORM frm_pf_status USING ct_extab TYPE slis_t_extab.
  SET PF-STATUS 'STATUS'.
  SET TITLEBAR 'TITLE'.
ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_user_command
*&---------------------------------------------------------------------*
*& 功能响应
*&---------------------------------------------------------------------*
FORM frm_user_command USING cv_ucomm LIKE sy-ucomm
                            cs_selfield TYPE slis_selfield.

  " 刷新屏幕数据到内表
  DATA: lo_grid TYPE REF TO cl_gui_alv_grid.
  CALL FUNCTION 'GET_GLOBALS_FROM_SLVC_FULLSCR'
    IMPORTING
      e_grid = lo_grid.
  CALL METHOD lo_grid->check_changed_data.

  " 按钮功能实现
  CASE cv_ucomm.
    WHEN '&IC1'. " 双击
    WHEN 'ZEXPORT'. " 导出
      PERFORM frm_export.
    WHEN OTHERS.
  ENDCASE.

  " 刷新ALV 显示值
  cs_selfield-refresh = abap_true .
  cs_selfield-row_stable = abap_true .
  cs_selfield-col_stable = abap_true .

ENDFORM.

*&---------------------------------------------------------------------*
*& START-OF-SELECTION
*&---------------------------------------------------------------------*
START-OF-SELECTION.
  PERFORM frm_main.

```

</details>
