# ALV

整理下ALV用到的几种方法。

<details>
  <summary>参考数据类型</summary>

```ABAP

TYPES:
  BEGIN OF ty_data,
    zsel         TYPE xfeld, " 勾选项
    mtype        TYPE bapi_mtype, " 处理结果
    msg          TYPE bapi_msg, " 处理文本
    rcol         TYPE char04, " 行颜色
    t_scol       TYPE lvc_t_scol, " 单元格颜色
    t_styl       TYPE lvc_t_styl, " 单元格样式
  END OF ty_data.
TYPES tt_data TYPE STANDARD TABLE OF ty_data WITH EMPTY KEY.

DATA gt_data TYPE tt_data.

```

</details>

## LVC

LVC好在不用画屏幕，直接调用即可。

<details>
    <summary>INCLUDE_LVC</summary>

```ABAP
    
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

    _init_fieldcat 'ZSEL' '选择项' '' ''.
    _init_fieldcat 'MTYPE' '处理状态' '' ''.
    _init_fieldcat 'MSG' '处理消息' '' ''.

    " 个性化自己输出数据格式
    LOOP AT ct_fieldcat REFERENCE INTO DATA(lr_fieldcat).
        IF lr_fieldcat->fieldname = 'ZSEL'.
        lr_fieldcat->checkbox = abap_true.
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

    " 获取已过滤行
    DATA lt_filter TYPE lvc_t_fidx.
    CALL METHOD lo_grid->get_filtered_entries
      IMPORTING
        et_filtered_entries = lt_filter.

    LOOP AT lt_rows INTO DATA(ls_row).
        READ TABLE lt_filter TRANSPORTING NO FIELDS WITH KEY table_line = ls_row-index.
        IF sy-subrc = 0.
          CONTINUE.
        ENDIF.
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

    DATA: lo_grid TYPE REF TO cl_gui_alv_grid.
    CALL FUNCTION 'GET_GLOBALS_FROM_SLVC_FULLSCR'
      IMPORTING
        e_grid = lo_grid.
        
    " 获取已过滤行
    DATA lt_filter TYPE lvc_t_fidx.
    CALL METHOD lo_grid->get_filtered_entries
      IMPORTING
        et_filtered_entries = lt_filter.
    
    LOOP AT gt_data REFERENCE INTO DATA(lr_data).
        READ TABLE lt_filter TRANSPORTING NO FIELDS WITH KEY table_line = sy-tabix.
        IF sy-subrc = 0.
          CONTINUE.
        ENDIF.
        CLEAR lr_data->zsel.
    ENDLOOP.

ENDFORM.

```

</details>

## ALV GRID

OOALV可定制的功能更完善，适合复杂的报表开发。

<details>
    <summary>INCLUDE_ALV_GRID</summary>

```ABAP

CLASS lcl_event_handler DEFINITION DEFERRED.

DATA go_container TYPE REF TO cl_gui_container.
DATA go_alv_grid TYPE REF TO cl_gui_alv_grid.
DATA go_handler TYPE REF TO lcl_event_handler.

*&---------------------------------------------------------------------*
*& Form lcl_event_handler
*&---------------------------------------------------------------------*
CLASS lcl_event_handler DEFINITION.
PUBLIC SECTION.
    " 数据变更事件
    METHODS on_data_changed_finished FOR EVENT data_changed_finished OF cl_gui_alv_grid
    IMPORTING
        e_modified
        et_good_cells.

    " 工具栏调整
    METHODS on_toolbar FOR EVENT toolbar OF cl_gui_alv_grid
    IMPORTING
        e_object
        e_interactive.

    " 响应工具栏事件
    " 点击按钮之类的事件
    METHODS on_user_command FOR EVENT user_command OF cl_gui_alv_grid
    IMPORTING
        e_ucomm.
ENDCLASS.
*&---------------------------------------------------------------------*
*& Form lcl_event_handler
*&---------------------------------------------------------------------*
CLASS lcl_event_handler IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& on_data_changed_finished
*&---------------------------------------------------------------------*
METHOD on_data_changed_finished.

    CHECK e_modified = abap_true.

    LOOP AT et_good_cells INTO DATA(ls_cell).
    READ TABLE gt_data REFERENCE INTO DATA(lr_data) INDEX ls_cell-row_id.
    IF sy-subrc = 0.

    ENDIF.
    ENDLOOP.

    PERFORM frm_refresh_display.

ENDMETHOD.

*&---------------------------------------------------------------------*
*& on_toolbar
*&---------------------------------------------------------------------*
METHOD on_toolbar.

    " 移除编辑相关的按钮
    DELETE e_object->mt_toolbar WHERE function CS '&LOCAL&'.

    " 新增按钮
    DATA ls_button LIKE LINE OF e_object->mt_toolbar.
    CLEAR ls_button.
    ls_button-function = 'Z10'.
    ls_button-icon = icon_system_copy.
    ls_button-quickinfo =
    ls_button-text      = ''.
    INSERT ls_button INTO TABLE e_object->mt_toolbar.

ENDMETHOD.

*&---------------------------------------------------------------------*
*& on_user_command
*&---------------------------------------------------------------------*
METHOD on_user_command.

    " 获取ALV选取行
    DATA lt_rows TYPE lvc_t_row.
    DATA ls_row TYPE lvc_s_row.
    CALL METHOD go_alv_grid->get_selected_rows
    IMPORTING
        et_index_rows = lt_rows.

    CASE e_ucomm.
    WHEN 'Z10'.

    WHEN OTHERS.
    ENDCASE.

    PERFORM frm_refresh_display.

ENDMETHOD.

ENDCLASS.

*&---------------------------------------------------------------------*
*& Form frm_display
*&---------------------------------------------------------------------*
*& ALV展示
*&---------------------------------------------------------------------*
FORM frm_display TABLES ct_data TYPE STANDARD TABLE.

    IF go_container IS NOT BOUND.
        go_container = NEW cl_gui_custom_container( 'CON_9000' ).
    ENDIF.

    IF go_alv_grid IS BOUND.
        PERFORM frm_refresh_display.
        RETURN.
    ENDIF.

    " 新建对象
    go_alv_grid = NEW cl_gui_alv_grid( go_container ).

    DATA ls_layout TYPE lvc_s_layo.
    DATA lt_fieldcat TYPE STANDARD TABLE OF lvc_s_fcat.

    PERFORM frm_set_layout CHANGING ls_layout.
    PERFORM frm_set_fieldcat TABLES lt_fieldcat.
    PERFORM frm_set_event.
    PERFORM frm_set_style.
    PERFORM frm_set_color.

    " 展示
    CALL METHOD go_alv_grid->set_table_for_first_display
      EXPORTING
        is_layout                     = ls_layout
        i_default                     = 'X'
        i_save                        = 'A'
      CHANGING
        it_outtab                     = ct_data[]
        it_fieldcatalog               = lt_fieldcat
      EXCEPTIONS
        invalid_parameter_combination = 1
        program_error                 = 2
        too_many_lines                = 3
        OTHERS                        = 4.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_display
*&---------------------------------------------------------------------*
*& 刷新ALV
*&---------------------------------------------------------------------*
FORM frm_refresh_display.

    PERFORM frm_set_style.
    PERFORM frm_set_color.

    go_alv_grid->refresh_table_display( is_stable = CONV #( 'XX' ) ).

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
    cs_layout-info_fname = 'RCOL'. " 行颜色
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

    _init_fieldcat 'ZSEL' '选择项' '' ''.
    _init_fieldcat 'MTYPE' '检查状态' '' ''.
    _init_fieldcat 'MSG  ' '检查消息' '' ''.

    " 个性化自己输出数据格式
    LOOP AT ct_fieldcat REFERENCE INTO DATA(lr_fieldcat).
        IF lr_fieldcat->fieldname = 'ZSEL'.
        lr_fieldcat->checkbox = abap_true.
        lr_fieldcat->edit = abap_true.
        ENDIF.
    ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_event
*&---------------------------------------------------------------------*
*& 绑定ALV事件
*&---------------------------------------------------------------------*
FORM frm_set_event.

    IF go_handler IS BOUND.
        RETURN.
    ENDIF.

    go_handler = NEW lcl_event_handler( ).

    " 数据变更
    go_alv_grid->register_edit_event( i_event_id = cl_gui_alv_grid=>mc_evt_modified ).
    SET HANDLER go_handler->on_data_changed_finished FOR go_alv_grid.

    " 工具栏相关
    SET HANDLER go_handler->on_toolbar FOR go_alv_grid.
    SET HANDLER go_handler->on_user_command FOR go_alv_grid.

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
*& Form frm_get_data_selection
*&---------------------------------------------------------------------*
*& 将侧边栏选择也传递到ZSEL字段上
*&---------------------------------------------------------------------*
FORM frm_get_data_selection.

  CHECK go_alv_grid IS BOUND.

  " 获取ALV选取行
  DATA lt_rows TYPE lvc_t_row.
  CALL METHOD go_alv_grid->get_selected_rows
    IMPORTING
      et_index_rows = lt_rows.

  " 获取已过滤行
  DATA lt_filter TYPE lvc_t_fidx.
  CALL METHOD lo_grid->get_filtered_entries
    IMPORTING
      et_filtered_entries = lt_filter.

  LOOP AT lt_rows INTO DATA(ls_row).
    READ TABLE lt_filter TRANSPORTING NO FIELDS WITH KEY table_line = ls_row-index.
    IF sy-subrc = 0.
      CONTINUE.
    ENDIF.
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

  DATA: lo_grid TYPE REF TO cl_gui_alv_grid.
  CALL FUNCTION 'GET_GLOBALS_FROM_SLVC_FULLSCR'
    IMPORTING
      e_grid = lo_grid.

  " 获取已过滤行
  DATA lt_filter TYPE lvc_t_fidx.
  CALL METHOD lo_grid->get_filtered_entries
    IMPORTING
      et_filtered_entries = lt_filter.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    READ TABLE lt_filter TRANSPORTING NO FIELDS WITH KEY table_line = sy-tabix.
    IF sy-subrc = 0.
      CONTINUE.
    ENDIF.
    CLEAR lr_data->zsel.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Module STATUS_9000 OUTPUT
*&---------------------------------------------------------------------*
*&
*&---------------------------------------------------------------------*
MODULE status_9000 OUTPUT.

    PERFORM frm_display TABLES gt_data.

    SET PF-STATUS 'STATUS'.
    SET TITLEBAR 'TITLE'.

ENDMODULE.
*&---------------------------------------------------------------------*
*&      Module  USER_COMMAND_9000  INPUT
*&---------------------------------------------------------------------*
*       text
*----------------------------------------------------------------------*
MODULE user_command_9000 INPUT.

    PERFORM frm_get_data_selection.

    CASE sy-ucomm.
        WHEN '&F03' OR '&F15' OR '&F12'.
        LEAVE TO SCREEN 0.
        WHEN OTHERS.
    ENDCASE.
    CLEAR sy-ucomm.

ENDMODULE.

```

</details>

## SALV

SALV最大问题在于不可编辑。尽管可以解决，但相当麻烦，不建议在复杂的开发场景中使用SALV。

> SALV实际上也是ALV GRID，所以只要获取到核心的GRID对象，即可解决上述问题。但……都这样了，为什么不直接用ALV GRID开发？

<details>
  <summary>示例代码</summary>

```ABAP

TYPES:
  BEGIN OF ty_detail,
    field1 TYPE string,
    field2 TYPE string,
  END OF ty_detail.
DATA gt_detail TYPE STANDARD TABLE OF ty_detail.
DATA go_salv TYPE REF TO cl_salv_table.

IF go_salv IS BOUND.
  go_salv->refresh( ).
  RETURN.
ENDIF.

TRY.
    cl_salv_table=>factory(
      IMPORTING
        r_salv_table = go_salv
      CHANGING
        t_table      = gt_detail ).
  CATCH cx_salv_msg.
    RETURN.
ENDTRY.

DATA(lo_setting) = go_salv->get_display_settings( ).
lo_setting->set_list_header( '标题' ).

DATA(lo_columns) = go_salv->get_columns( ).
lo_columns->set_optimize( abap_true ).
TRY.
    DATA lo_column TYPE REF TO cl_salv_column_table.
    DEFINE _set_savl_column.
      lo_column ?= lo_columns->get_column( &1 ).
      lo_column->set_long_text( &2 ).
      lo_column->set_medium_text( &2 ).
      lo_column->set_short_text( &2 ).
    END-OF-DEFINITION.

    _set_savl_column 'ZFIELD1' '字段1'.
    _set_savl_column 'ZFIELD2' '字段2'.

  CATCH cx_salv_not_found.
ENDTRY.

" 设置工具栏按钮
DATA(lo_functions) = go_salv->get_functions( ).
lo_functions->set_all( abap_true ).

" 弹窗模式，不弹窗的话，注释即可
go_salv->set_screen_popup(
  start_column = 30
  end_column   = 150
  start_line   = 2
  end_line     = 15 ).

" 展示SALV报表
go_salv->display( ).

```

</details>

## 选择屏幕

感觉选择屏幕的这段代码也挺好用的，放上来分享下

<details>
  <summary>示例代码</summary>

```ABAP

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
  %_s_werks_%_app_%-text = '工厂'.

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

```

</details>
