# 批量翻译工具

<details open>
  <summary>示例代码</summary>

```ABAP

*&---------------------------------------------------------------------*
*& Report YHXF_DEMO06
*&---------------------------------------------------------------------*
*&
*&---------------------------------------------------------------------*
REPORT yhxf_demo06.

TYPES:
  BEGIN OF ty_data,
    kind        TYPE string,
    name        TYPE ddobjname,
    text_zh     TYPE string,
    new_text_zh TYPE string,
    text_en     TYPE string,
    new_text_en TYPE string,

    zsel        TYPE xfeld, " 勾选项
    mtype       TYPE bapi_mtype, " 处理结果
    msg         TYPE bapi_msg, " 处理文本
    rcol        TYPE char04, " 行颜色
    t_scol      TYPE lvc_t_scol, " 单元格颜色
    t_styl      TYPE lvc_t_styl, " 单元格样式
  END OF ty_data.
DATA gt_data TYPE STANDARD TABLE OF ty_data WITH EMPTY KEY.

*&---------------------------------------------------------------------*
*& Include          YHXF_DEMO06_SEL
*&---------------------------------------------------------------------*

TABLES dd01v.
TABLES dd04v.
SELECTION-SCREEN BEGIN OF BLOCK b900 WITH FRAME TITLE b900.
  SELECT-OPTIONS s_doma FOR dd01v-domname.
  SELECT-OPTIONS s_dtel FOR dd04v-rollname.
SELECTION-SCREEN END OF BLOCK b900.

*&---------------------------------------------------------------------*
*& INITIALIZATION
*&---------------------------------------------------------------------*
INITIALIZATION.
  PERFORM frm_sel_scr_init.

*&---------------------------------------------------------------------*
*& PBO
*&---------------------------------------------------------------------*
AT SELECTION-SCREEN OUTPUT.
  PERFORM frm_sel_scr_pbo.

*&---------------------------------------------------------------------*
*& PAI
*&---------------------------------------------------------------------*
AT SELECTION-SCREEN.
  PERFORM frm_sel_scr_pai.

*&---------------------------------------------------------------------*
*& Form frm_sel_scr_init
*&---------------------------------------------------------------------*
*& 屏幕初始化
*&---------------------------------------------------------------------*
FORM frm_sel_scr_init .

  b900 = '选择条件'.
  %_s_doma_%_app_%-text = '域'.
  %_s_dtel_%_app_%-text = '数据元素'.

*  CLEAR s_doma.
*  s_doma[] = VALUE #( sign = 'I' option = 'CP'
*    ( low = 'ZACC*' )
*    ( low = 'ZD*' )
*  ).
*
*  CLEAR s_dtel.
*  s_dtel[] = VALUE #( sign = 'I' option = 'CP'
*    ( low = 'ZACC*' )
*    ( low = 'ZE*' )
*  ).

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_sel_scr_pbo
*&---------------------------------------------------------------------*
*& 屏幕PBO
*&---------------------------------------------------------------------*
FORM frm_sel_scr_pbo .

  " 关闭全部分组项目，未分组会展示
  LOOP AT SCREEN.
    IF screen-group1 IS NOT INITIAL.
      screen-input = '0'.
      screen-invisible = '1'.
      MODIFY SCREEN.
    ENDIF.
  ENDLOOP.

  " 显示分组
  DEFINE _active_grp.
    LOOP AT SCREEN.
      IF screen-group1 = &1.
        screen-input = '1'.
        screen-invisible = '0'.
        MODIFY SCREEN.
      ENDIF.
    ENDLOOP.
  END-OF-DEFINITION.

  " 隐藏分组
  DEFINE _inactive_grp.
    LOOP AT SCREEN.
      IF screen-group1 = &1.
        screen-input = '0'.
        screen-invisible = '1'.
        MODIFY SCREEN.
      ENDIF.
    ENDLOOP.
  END-OF-DEFINITION.

  _active_grp 'M01'.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_sel_scr_pai
*&---------------------------------------------------------------------*
*& 屏幕PAI
*&---------------------------------------------------------------------*
FORM frm_sel_scr_pai .

ENDFORM.
*&---------------------------------------------------------------------*
*& Include          YHXF_DEMO06_ALV
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
  PERFORM frm_set_style.
  PERFORM frm_set_color.

  CALL FUNCTION 'REUSE_ALV_GRID_DISPLAY_LVC'
    EXPORTING
      i_callback_program       = sy-repid
      i_callback_pf_status_set = 'FRM_PF_STATUS'
      i_callback_user_command  = 'FRM_USER_COMMAND'
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
  cs_layout-cwidth_opt = abap_true. " 自动调整ALV列宽
  cs_layout-sel_mode = 'A'. " 选择模式
  cs_layout-info_fname = 'RCOL'. " 行颜色设置
  cs_layout-ctab_fname = 'T_SCOL'. " 单元格颜色设置
  cs_layout-stylefname = 'T_STYL'. " 单元格控制

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
    ls_fieldcat-scrtext_s =
    ls_fieldcat-scrtext_m =
    ls_fieldcat-scrtext_l =
    ls_fieldcat-tooltip =
    ls_fieldcat-coltext =
    ls_fieldcat-seltext = &2.
    ls_fieldcat-ref_table = &3.
    ls_fieldcat-ref_field = &4.
    INSERT ls_fieldcat INTO TABLE ct_fieldcat.
  END-OF-DEFINITION.

  _init_fieldcat 'ZSEL' 'Selection'(t01) '' ''.
  _init_fieldcat 'MTYPE' 'Status'(t02) '' ''.
  _init_fieldcat 'MSG' 'Message'(t03) '' ''.

  _init_fieldcat 'NAME' 'Name'(t04) '' ''.
  _init_fieldcat 'KIND' 'Kind'(t05) '' ''.
  _init_fieldcat 'TEXT_ZH' 'Chinese'(t06) '' ''.
  _init_fieldcat 'NEW_TEXT_ZH' 'Chinese(modified)'(t07) '' ''.
  _init_fieldcat 'TEXT_EN' 'English'(t08) '' ''.
  _init_fieldcat 'NEW_TEXT_EN' 'English(modified)'(t09) '' ''.

  " 个性化自己输出数据格式
  LOOP AT ct_fieldcat REFERENCE INTO DATA(lr_fieldcat).
    IF lr_fieldcat->fieldname = 'ZSEL'.
      lr_fieldcat->checkbox = abap_true.
      lr_fieldcat->edit = abap_true.
    ENDIF.

    IF lr_fieldcat->fieldname = 'NEW_TEXT_ZH'
    OR lr_fieldcat->fieldname = 'NEW_TEXT_EN'.
      lr_fieldcat->edit = abap_true.
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_style
*&---------------------------------------------------------------------*
*& 字段样式设置
*&---------------------------------------------------------------------*
FORM frm_set_style.

  DATA ls_styl TYPE lvc_s_styl.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    CLEAR lr_data->t_styl.

    " 设置ALV字段或行的状态
    " 常用有禁止编辑CL_GUI_ALV_GRID=>MC_STYLE_DISABLED
    " 禁止删除行CL_GUI_ALV_GRID=>MC_STYLE_NO_DELETE_ROW

  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_color
*&---------------------------------------------------------------------*
*& 字段颜色设置
*&---------------------------------------------------------------------*
FORM frm_set_color.

  STATICS:
    BEGIN OF color,
      r_light   TYPE char04,
      r_success TYPE char04,
      r_error   TYPE char04,
      light     TYPE lvc_s_scol-color,
      success   TYPE lvc_s_scol-color,
      error     TYPE lvc_s_scol-color,
    END OF color.
  IF color IS INITIAL.
    color-r_light = 'C300'.
    color-r_success = 'C500'.
    color-r_error = 'C600'.
    color-light = VALUE #( col = 3 ).
    color-success = VALUE #( col = 5 ).
    color-error = VALUE #( col = 6 ).
  ENDIF.

  DATA ls_scol TYPE lvc_s_scol.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    CLEAR lr_data->t_scol.

    IF lr_data->zsel = abap_true.
      lr_data->rcol = color-r_light.
    ENDIF.

    IF lr_data->mtype = 'E'.
      lr_data->t_scol = VALUE #( BASE lr_data->t_scol color = color-error
        ( fname = 'MTYPE' )
        ( fname = 'MSG' )
      ).
    ENDIF.
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

  PERFORM frm_get_data_selection.

  " 按钮功能实现
  CASE cv_ucomm.
    WHEN '&IC1'. " 双击
    WHEN 'TRANS'. " 翻译
      PERFORM frm_translation.
    WHEN OTHERS.
  ENDCASE.

*  PERFORM frm_reset_data_selection.

  " 刷新ALV 显示值
  cs_selfield-refresh = abap_true .
  cs_selfield-row_stable = abap_true .
  cs_selfield-col_stable = abap_true .

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_data_selection
*&---------------------------------------------------------------------*
*& 将侧边栏选择也传递到ZSEL字段上
*&---------------------------------------------------------------------*
FORM frm_get_data_selection.

  " 刷新屏幕数据到内表
  DATA: lo_grid TYPE REF TO cl_gui_alv_grid.
  CALL FUNCTION 'GET_GLOBALS_FROM_SLVC_FULLSCR'
    IMPORTING
      e_grid = lo_grid.

  " 获取ALV选取行
  DATA lt_rows TYPE lvc_t_row.
  CALL METHOD lo_grid->get_selected_rows
    IMPORTING
      et_index_rows = lt_rows.

  LOOP AT lt_rows INTO DATA(ls_row).
    READ TABLE gt_data REFERENCE INTO DATA(lr_data) INDEX ls_row-index.
    IF sy-subrc = 0.
      lr_data->zsel = abap_true.
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_reset_data_selection
*&---------------------------------------------------------------------*
*& 重置勾选项
*&---------------------------------------------------------------------*
FORM frm_reset_data_selection.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    CLEAR lr_data->zsel.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Include          YHXF_DEMO06_FRM
*&---------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*& Form frm_main
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
*& -->  p1        text
*& <--  p2        text
*&---------------------------------------------------------------------*
FORM frm_main .

  PERFORM frn_get_element.
  PERFORM frn_get_domain.
  PERFORM frm_display TABLES gt_data.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frn_get_element
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
*& -->  p1        text
*& <--  p2        text
*&---------------------------------------------------------------------*
FORM frn_get_element .
  IF s_dtel[] IS INITIAL.
    RETURN.
  ENDIF.

  SELECT
    rollname AS name,
    ddlanguage AS langu,
    ddtext AS text
    FROM dd04v
    WHERE rollname IN @s_dtel
    INTO TABLE @DATA(lt_dd).

  LOOP AT lt_dd INTO DATA(ls_dd)
    GROUP BY ( name  = ls_dd-name ) INTO DATA(ls_dd_grp).
    DATA ls_data TYPE ty_data.
    CLEAR ls_data.
    ls_data-name = ls_dd_grp-name.
    ls_data-kind = 'DTEL'.
    LOOP AT GROUP ls_dd_grp INTO ls_dd.
      CASE ls_dd-langu.
        WHEN '1'. ls_data-text_zh = ls_dd-text.
        WHEN 'E'. ls_data-text_en = ls_dd-text.
        WHEN OTHERS.
      ENDCASE.
    ENDLOOP.
    INSERT ls_data INTO TABLE gt_data.
  ENDLOOP.

  SORT gt_data BY name.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frn_get_domain
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
*& -->  p1        text
*& <--  p2        text
*&---------------------------------------------------------------------*
FORM frn_get_domain .
  IF s_doma[] IS INITIAL.
    RETURN.
  ENDIF.

  SELECT
    domname AS name,
    ddlanguage AS langu,
    ddtext AS text
    FROM dd01v
    WHERE domname IN @s_doma
    INTO TABLE @DATA(lt_dd).

  LOOP AT lt_dd INTO DATA(ls_dd)
    GROUP BY ( name  = ls_dd-name ) INTO DATA(ls_dd_grp).
    DATA ls_data TYPE ty_data.
    CLEAR ls_data.
    ls_data-name = ls_dd_grp-name.
    ls_data-kind = 'DOMA'.
    LOOP AT GROUP ls_dd_grp INTO ls_dd.
      CASE ls_dd-langu.
        WHEN '1'. ls_data-text_zh = ls_dd-text.
        WHEN 'E'. ls_data-text_en = ls_dd-text.
        WHEN OTHERS.
      ENDCASE.
    ENDLOOP.
    INSERT ls_data INTO TABLE gt_data.
  ENDLOOP.

  SORT gt_data BY name.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_translation
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
*& -->  p1        text
*& <--  p2        text
*&---------------------------------------------------------------------*
FORM frm_translation .

  LOOP AT gt_data REFERENCE INTO DATA(lr_data) WHERE zsel = abap_true.
    DEFINE _def_msg.
      lr_data->msg = |{ lr_data->msg }[{ &1 }-{ &2 }]{ &3 }[{ sy-subrc }];|.
    END-OF-DEFINITION.

    CASE lr_data->kind.
      WHEN 'DTEL'.
        DATA ls_dd04v TYPE dd04v.
        " 先取无语言值
        CALL FUNCTION 'DDIF_DTEL_GET'
          EXPORTING
            name          = lr_data->name
          IMPORTING
            dd04v_wa      = ls_dd04v
          EXCEPTIONS
            illegal_input = 1
            OTHERS        = 2.
        IF sy-subrc <> 0.
          CONTINUE.
        ENDIF.

        DATA ls_dd04v_modify TYPE dd04v.
        DEFINE _def_modify_dtel.
          IF &2 IS NOT INITIAL.
            ls_dd04v_modify = ls_dd04v.
            ls_dd04v_modify-ddlanguage = &1.
            ls_dd04v_modify-scrtext_s =
            ls_dd04v_modify-scrtext_m =
            ls_dd04v_modify-scrtext_l =
            ls_dd04v_modify-ddtext = &2.
            CALL FUNCTION 'DDIF_DTEL_PUT'
              EXPORTING
                name              = ls_dd04v_modify-rollname
                dd04v_wa          = ls_dd04v_modify
              EXCEPTIONS
                dtel_not_found    = 1
                name_inconsistent = 2
                dtel_inconsistent = 3
                put_failure       = 4
                put_refused       = 5
                OTHERS            = 6.
            CALL FUNCTION 'DDIF_DTEL_ACTIVATE'
              EXPORTING
                name        = ls_dd04v_modify-rollname
              EXCEPTIONS
                not_found   = 1
                put_failure = 2
                OTHERS      = 3.
          ENDIF.
        END-OF-DEFINITION.
        IF lr_data->new_text_zh IS NOT INITIAL AND lr_data->text_zh <> lr_data->new_text_zh.
          _def_modify_dtel '1' lr_data->new_text_zh.
          _def_msg 'DTEL' 'ZH' lr_data->name.
          lr_data->text_zh = lr_data->new_text_zh.
        ENDIF.
        IF lr_data->new_text_en IS NOT INITIAL AND lr_data->text_en <> lr_data->new_text_en.
          _def_modify_dtel 'E' lr_data->new_text_en.
          _def_msg 'DTEL' 'EN' lr_data->name.
          lr_data->text_en = lr_data->new_text_en.
        ENDIF.

      WHEN 'DOMA'.
        DATA ls_dd01v TYPE dd01v.
        " 先取无语言值
        CALL FUNCTION 'DDIF_DOMA_GET'
          EXPORTING
            name          = lr_data->name
          IMPORTING
            dd01v_wa      = ls_dd01v
          EXCEPTIONS
            illegal_input = 1
            OTHERS        = 2.
        IF sy-subrc <> 0.
          CONTINUE.
        ENDIF.

        DATA ls_dd01v_modify TYPE dd01v.
        DEFINE _def_modify_doma.
          IF &2 IS NOT INITIAL.
            ls_dd01v_modify = ls_dd01v.
            ls_dd01v_modify-ddlanguage = &1.
            ls_dd01v_modify-ddtext = &2.
            CALL FUNCTION 'DDIF_DOMA_PUT'
              EXPORTING
                name              = ls_dd01v_modify-domname
                dd01v_wa          = ls_dd01v_modify
              EXCEPTIONS
                dtel_not_found    = 1
                name_inconsistent = 2
                dtel_inconsistent = 3
                put_failure       = 4
                put_refused       = 5
                OTHERS            = 6.
            CALL FUNCTION 'DDIF_DOMA_ACTIVATE'
              EXPORTING
                name        = ls_dd01v_modify-domname
              EXCEPTIONS
                not_found   = 1
                put_failure = 2
                OTHERS      = 3.
          ENDIF.
        END-OF-DEFINITION.
        IF lr_data->new_text_zh IS NOT INITIAL AND lr_data->text_zh <> lr_data->new_text_zh.
          _def_modify_doma '1' lr_data->new_text_zh.
          _def_msg 'DOMA' 'ZH' lr_data->name.
          lr_data->text_zh = lr_data->new_text_zh.
        ENDIF.
        IF lr_data->new_text_en IS NOT INITIAL AND lr_data->text_en <> lr_data->new_text_en.
          _def_modify_doma 'E' lr_data->new_text_en.
          _def_msg 'DOMA' 'EN' lr_data->name.
          lr_data->text_en = lr_data->new_text_en.
        ENDIF.

      WHEN OTHERS.
    ENDCASE.
  ENDLOOP.

ENDFORM.

START-OF-SELECTION.
  PERFORM frm_main.

```

</details>
