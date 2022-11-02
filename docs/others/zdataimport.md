# 导表程序

小心别把标准表的数据覆盖了

> 还有个选择导入列的功能，后面有空再补充

<details>
  <summary>示例代码</summary>

```ABAP

*&---------------------------------------------------------------------*
*& Report ZDATAIMPORT
*&---------------------------------------------------------------------*
*& 1 2022年9月16日 初始
*&---------------------------------------------------------------------*
REPORT zdataimport.

*&---------------------------------------------------------------------*
*& 类型定义
*&---------------------------------------------------------------------*
" 用于选取更新列
TYPES:
  BEGIN OF ty_field,
    zname TYPE lvc_s_fcat-fieldname,
    ztext TYPE lvc_s_fcat-scrtext_l,
    zkey  TYPE xfeld,
    zsel  TYPE xfeld,
  END OF ty_field.
TYPES tt_field TYPE STANDARD TABLE OF ty_field.

*&---------------------------------------------------------------------*
*& 本地类声明
*&---------------------------------------------------------------------*
CLASS lcl_event_handler DEFINITION DEFERRED.

*&---------------------------------------------------------------------*
*& 本地类定义
*&---------------------------------------------------------------------*
CLASS lcl_event_handler DEFINITION.
  PUBLIC SECTION.
    METHODS on_dialogbox_close FOR EVENT close OF cl_gui_dialogbox_container
      IMPORTING sender.
    METHODS on_toolbar FOR EVENT toolbar OF cl_gui_alv_grid
      IMPORTING
        e_object
        e_interactive.
    METHODS on_user_command FOR EVENT user_command OF cl_gui_alv_grid
      IMPORTING
        e_ucomm.
ENDCLASS.

*&---------------------------------------------------------------------*
*& 本地类定义
*&---------------------------------------------------------------------*
CLASS lcl_event_handler IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& on_dialogbox_close
*&---------------------------------------------------------------------*
  METHOD on_dialogbox_close.
    " 隐藏即可，重复创建没必要
    IF sender IS NOT INITIAL.
      sender->set_visible( cl_gui_dialogbox_container=>visible_false ).
    ENDIF.
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
    ls_button-icon = icon_execute_object.
    ls_button-quickinfo =
    ls_button-text      = '确认导入'.
    INSERT ls_button INTO TABLE e_object->mt_toolbar.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& on_user_command
*&---------------------------------------------------------------------*
  METHOD on_user_command.
    IF e_ucomm = 'Z10'.
      PERFORM frm_import.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

*&---------------------------------------------------------------------*
*& TOP
*&---------------------------------------------------------------------*
DATA gr_data_tab TYPE REF TO data.
DATA gt_fieldcat TYPE lvc_t_fcat.
DATA gt_rows TYPE lvc_t_row. " 选取行项目

" 弹窗选择需要更新的列
DATA go_con_fields TYPE REF TO cl_gui_dialogbox_container.
DATA go_grid_fields TYPE REF TO cl_gui_alv_grid.
*DATA gt_fieldcat TYPE lvc_t_fcat. " 重名，想了想，设置为局部参数传值即可
DATA gt_field TYPE tt_field.

" 事件类
DATA go_event_handler TYPE REF TO lcl_event_handler.

*&---------------------------------------------------------------------*
*& 选择屏幕
*&---------------------------------------------------------------------*
PARAMETERS: rb1 RADIOBUTTON GROUP rg1 USER-COMMAND rg1 DEFAULT 'X', " 上传数据
            rb2 RADIOBUTTON GROUP rg1 . " 下载模板

PARAMETERS p_tabnam TYPE tabname16.
PARAMETERS p_file TYPE rlgrap-filename MODIF ID m1.
PARAMETERS p_dbdata TYPE xfeld MODIF ID m2. " 包括表数据

SELECTION-SCREEN ULINE.
SELECTION-SCREEN COMMENT /2(70) comm1.

*&---------------------------------------------------------------------*
*& INITIALIZATION
*&---------------------------------------------------------------------*
INITIALIZATION.
  PERFORM frm_initialization.

*&---------------------------------------------------------------------*
*& AT SELECTION-SCREEN
*&---------------------------------------------------------------------*
AT SELECTION-SCREEN OUTPUT.
  PERFORM frm_set_screen.

*&---------------------------------------------------------------------*
*& AT SELECTION-SCREEN
*&---------------------------------------------------------------------*
AT SELECTION-SCREEN ON VALUE-REQUEST FOR p_file.
  PERFORM frm_f4_file CHANGING p_file.

*&---------------------------------------------------------------------*
*& Form frm_set_screen
*&---------------------------------------------------------------------*
*& 选择屏幕控制
*&---------------------------------------------------------------------*
FORM frm_set_screen.
  LOOP AT SCREEN.
    CASE screen-group1.
      WHEN 'M1'.
        IF rb2 = 'X'.
          screen-active = '0'.
          screen-invisible = '1'.
        ELSE.
          screen-active = '1'.
          screen-invisible = '0'.
        ENDIF.
        MODIFY SCREEN.
      WHEN 'M2'.
        IF rb1 = 'X'.
          screen-active = '0'.
          screen-invisible = '1'.
        ELSE.
          screen-active = '1'.
          screen-invisible = '0'.
        ENDIF.
        MODIFY SCREEN.
    ENDCASE.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_f4_file
*&---------------------------------------------------------------------*
*& 文件搜索帮助
*&---------------------------------------------------------------------*
FORM frm_f4_file CHANGING c_file TYPE rlgrap-filename.

  c_file = cl_openxml_helper=>browse_local_file_open(
    EXPORTING
      iv_title      = 'Open'
      iv_filename   = 'import.xlsx'
      iv_extpattern = '*.xlsx'
  ).

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_initialization
*&---------------------------------------------------------------------*
*& 程序初始化
*&---------------------------------------------------------------------*
FORM frm_initialization .

  GET PARAMETER ID 'DTB' FIELD p_tabnam.
  GET PARAMETER ID 'ZF' FIELD p_file.

  %_rb1_%_app_%-text = '批量导入'.
  %_rb2_%_app_%-text = '下载批导模板'.
  %_p_tabnam_%_app_%-text = '表名'.
  %_p_file_%_app_%-text = '文件路径'.
  %_p_dbdata_%_app_%-text = '包括数据库表数据'.

  comm1 = '备注：第一行为字段名称，第二行为抬头文本，第三行及后续为数据行'.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form FRM_MAIN
*&---------------------------------------------------------------------*
*& 程序入口
*&---------------------------------------------------------------------*
FORM frm_main .

  CHECK sy-tcode <> 'ZDATAIMPORT'.

  SET PARAMETER ID 'DTB' FIELD p_tabnam.
  SET PARAMETER ID 'ZF' FIELD p_file.

  PERFORM frm_create_dynamic_table. " 创建动态表格
  CASE 'X'.
    WHEN rb1.
      PERFORM frm_upload_data.
      PERFORM frm_display.
    WHEN rb2.
      PERFORM frm_download_template.
  ENDCASE.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_create_dynamic_table
*&---------------------------------------------------------------------*
*& 创建表格数据表格
*&---------------------------------------------------------------------*
FORM frm_create_dynamic_table .

  PERFORM frm_check_input.

  TRY.
      CREATE DATA gr_data_tab TYPE STANDARD TABLE OF (p_tabnam).
    CATCH cx_root INTO DATA(lx_root).
      MESSAGE lx_root->get_text( ) TYPE 'E'.
  ENDTRY.

  DATA l_name TYPE dd02l-tabname.
  l_name = p_tabnam.
  CALL FUNCTION 'LVC_FIELDCATALOG_MERGE'
    EXPORTING
      i_structure_name       = l_name
      i_bypassing_buffer     = 'X'
    CHANGING
      ct_fieldcat            = gt_fieldcat
    EXCEPTIONS
      inconsistent_interface = 1
      program_error          = 2
      OTHERS                 = 3.
  IF sy-subrc <> 0.
*    MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
*               WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_check_input
*&---------------------------------------------------------------------*
*& 输入校验
*&---------------------------------------------------------------------*
FORM frm_check_input .

  IF p_tabnam IS INITIAL.
    MESSAGE |请输入表名| TYPE 'S' DISPLAY LIKE 'E'.
    LEAVE LIST-PROCESSING.
  ENDIF.

  IF p_tabnam(1) = 'Z'
  OR p_tabnam(1) = 'Y'.
  ELSE.
    MESSAGE |表{ p_tabnam }非自建表，不允许修改| TYPE 'S' DISPLAY LIKE 'E'.
    LEAVE LIST-PROCESSING.
  ENDIF.

  SELECT SINGLE COUNT(*) FROM dd02l WHERE tabname = @p_tabnam.
  IF sy-subrc <> 0.
    MESSAGE |表{ p_tabnam }不存在| TYPE 'S' DISPLAY LIKE 'E'.
    LEAVE LIST-PROCESSING.
  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_upload_data
*&---------------------------------------------------------------------*
*& 上传文件
*&---------------------------------------------------------------------*
FORM frm_upload_data.

  TRY.
      DATA(l_buffer) = cl_openxml_helper=>load_local_file( CONV #( p_file ) ).
      DATA(lo_xlsx) = cl_ehfnd_xlsx=>get_instance( ).
      DATA(lo_doc) = lo_xlsx->load_doc( l_buffer ).
      DATA(lt_sheet_info) = lo_doc->get_sheets( ).
      DATA(lo_sheet) = lo_doc->get_sheet_by_id( lt_sheet_info[ 1 ]-sheet_id ).
    CATCH
      cx_openxml_format
      cx_openxml_not_found
      cx_openxml_not_allowed
      INTO DATA(lx_root).
      MESSAGE lx_root->get_text( ) TYPE 'S' DISPLAY LIKE 'E'.
      LEAVE LIST-PROCESSING.
  ENDTRY.

  FIELD-SYMBOLS <fs_data_tab> TYPE STANDARD TABLE.
  FIELD-SYMBOLS <fs_data> TYPE any.
  FIELD-SYMBOLS <fs_field> TYPE any.

  ASSIGN gr_data_tab->* TO <fs_data_tab>. " 动态处理

  DATA l_row TYPE i VALUE 2. " 跳过抬头列和抬头文本列
  DATA(l_row_last) = lo_sheet->get_last_row_number( ).
  DATA l_column TYPE i.
  DATA l_value TYPE string.

  WHILE l_row < l_row_last.
    l_row = l_row + 1.
    INSERT INITIAL LINE INTO TABLE <fs_data_tab> ASSIGNING <fs_data>.
    CLEAR l_column.
    LOOP AT gt_fieldcat INTO DATA(ls_fieldcat).
      l_column = l_column + 1.
      UNASSIGN <fs_field>.
      ASSIGN COMPONENT ls_fieldcat-fieldname OF STRUCTURE <fs_data> TO <fs_field>.
      IF <fs_field> IS ASSIGNED.
        l_value = lo_sheet->get_cell_content(
                    iv_row    = l_row
                    iv_column = l_column ).
        PERFORM conv USING 'INPUT' l_value CHANGING <fs_field>.
      ENDIF.
    ENDLOOP.
  ENDWHILE.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_download_template
*&---------------------------------------------------------------------*
*& 下载导入模板
*&---------------------------------------------------------------------*
FORM frm_download_template.

  TRY.
      DATA(lo_xlsx) = cl_ehfnd_xlsx=>get_instance( ).
      DATA(lo_doc) = lo_xlsx->create_doc( ).
      DATA(lt_sheet_info) = lo_doc->get_sheets( ).
      DATA(lo_sheet) = lo_doc->get_sheet_by_id( lt_sheet_info[ 1 ]-sheet_id ).
    CATCH
      cx_openxml_format
      cx_openxml_not_found
      cx_openxml_not_allowed
      INTO DATA(lx_root).
      MESSAGE lx_root->get_text( ) TYPE 'S' DISPLAY LIKE 'E'.
      LEAVE LIST-PROCESSING.
  ENDTRY.

  DATA l_row TYPE i.
  DATA l_column TYPE i.

  LOOP AT gt_fieldcat ASSIGNING FIELD-SYMBOL(<fs_fieldcat>).
    l_column = sy-tabix.
    lo_sheet->set_cell_content( " 字段名
      EXPORTING
        iv_row          = 1
        iv_column       = l_column
        iv_value        = <fs_fieldcat>-fieldname ).
    lo_sheet->set_cell_content( " 抬头文本
      EXPORTING
        iv_row          = 2
        iv_column       = l_column
        iv_value        = <fs_fieldcat>-scrtext_l ).
  ENDLOOP.

  IF p_dbdata = abap_true.
    FIELD-SYMBOLS <fs_table> TYPE STANDARD TABLE.
    FIELD-SYMBOLS <fs_structure> TYPE any.
    FIELD-SYMBOLS <fs_field> TYPE any.

    ASSIGN gr_data_tab->* TO <fs_table>.
    SELECT * FROM (p_tabnam) INTO TABLE @<fs_table>.
    l_row = 2. " 从第三行开始填充数据
    LOOP AT <fs_table> ASSIGNING <fs_structure>.
      l_row = l_row + 1.
      CLEAR l_column.
      LOOP AT gt_fieldcat ASSIGNING <fs_fieldcat>.
        l_column = l_column + 1.
        UNASSIGN <fs_field>.
        ASSIGN COMPONENT <fs_fieldcat>-fieldname OF STRUCTURE <fs_structure> TO <fs_field>.
        IF <fs_field> IS ASSIGNED .
          lo_sheet->set_cell_content(
            EXPORTING
              iv_row    = l_row
              iv_column = l_column
              iv_value  = <fs_field> ).
        ENDIF.
      ENDLOOP.
    ENDLOOP.
  ENDIF.

  " 获取下载目标
  DATA(l_filename) = cl_openxml_helper=>browse_local_file_save(
      iv_title      = 'Save as'
      iv_filename   = |{ p_tabnam }.xlsx|
      iv_extpattern = '*.xlsx|*.xlsx' ).
  CHECK l_filename IS NOT INITIAL.

  p_file = l_filename. " 顺便更新下选择屏幕

  TRY.
      cl_openxml_helper=>store_local_file(
          im_file_name = l_filename
          im_data      = lo_doc->save( ) ).
    CATCH
      cx_openxml_format
      cx_openxml_not_found
      cx_openxml_not_allowed
      cx_dynamic_check
      INTO DATA(lx_openxml).
      MESSAGE lx_openxml->get_longtext( ) TYPE 'S' DISPLAY LIKE 'E'.
      LEAVE LIST-PROCESSING.
  ENDTRY.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form conv
*&---------------------------------------------------------------------*
*& 数据转换
*&---------------------------------------------------------------------*
FORM conv USING dataflow input CHANGING output.

  DATA l_subrc TYPE subrc VALUE 4.
  DATA l_value TYPE string.
  DATA l_convexit TYPE string.
  DATA l_fm_convexit TYPE rs38l_fnam. " 转换例程函数

  DESCRIBE FIELD output TYPE DATA(l_type) EDIT MASK DATA(l_mask).

  " EDIT MASK取出来的值如：==ALPHA、==MATN1
  CLEAR l_convexit.
  IF strlen( l_mask ) > 2.
    l_convexit = l_mask+2.
  ELSEIF l_type = 'N'. " 如果是NUMC类型，默认ALPHA转换
    l_convexit = 'ALPHA'.
  ENDIF.

  CASE l_type.
    WHEN 'D' OR 'T'. " 日期时间格式
      l_value = input.
      REPLACE ALL OCCURRENCES OF REGEX '[^0-9]' IN l_value WITH ''.
      output = l_value.
    WHEN OTHERS.
      " 检查字段是否有输出转换
      IF l_convexit IS INITIAL.
        output = input.
      ELSE.
        TRY.
            " EDIT MASK不支持STRING，还是要用CONVEXIT的方法
            l_fm_convexit = |CONVERSION_EXIT_{ l_convexit }_{ dataflow }|.
            CALL FUNCTION l_fm_convexit
              EXPORTING
                input  = input
              IMPORTING
                output = output
              EXCEPTIONS
                OTHERS = 99.
            IF sy-subrc <> 0.
              output = input. " 转换错误，直接输入
            ENDIF.
          CATCH cx_root.
            output = input.
        ENDTRY.
      ENDIF.
  ENDCASE.

  " CONDENSE必须是Character-Like
  IF l_type = 'C' OR l_type = 'N' OR l_type = 'g'.
    CONDENSE output. " 去除多余空格
  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_import
*&---------------------------------------------------------------------*
*& 保存
*&---------------------------------------------------------------------*
FORM frm_import.

*  READ TABLE gt_field TRANSPORTING NO FIELDS WITH KEY zsel = 'X'.
*  IF sy-subrc <> 0.
*    MESSAGE '请选择需要更新的列' TYPE 'S' DISPLAY LIKE 'E'.
*    RETURN.
*  ENDIF.
*
*  DATA l_answer.
*  CALL FUNCTION 'POPUP_TO_CONFIRM'
*    EXPORTING
*      text_question  = '该该操作不可回滚，是否执行？'
*    IMPORTING
*      answer         = l_answer
*    EXCEPTIONS
*      text_not_found = 1
*      OTHERS         = 2.
*  IF l_answer <> '1'.
*    RETURN.
*  ENDIF.

  FIELD-SYMBOLS <gt_data> TYPE STANDARD TABLE.
  ASSIGN gr_data_tab->* TO <gt_data>.

  " 复制局部参数
  FIELD-SYMBOLS <lt_data> TYPE STANDARD TABLE.
  DATA lr_data_tab TYPE REF TO data.
  CREATE DATA lr_data_tab LIKE <gt_data>.
  ASSIGN lr_data_tab->* TO <lt_data>.

  " 仅导入选取行
  LOOP AT gt_rows INTO DATA(ls_rows).
    READ TABLE <gt_data> ASSIGNING FIELD-SYMBOL(<ls_data>) INDEX ls_rows.
    IF sy-subrc = 0.
      INSERT <ls_data> INTO TABLE <lt_data>.
    ENDIF.
  ENDLOOP.

  READ TABLE gt_fieldcat TRANSPORTING NO FIELDS WITH KEY key = ''.
  IF sy-subrc = 0.
    " 包括普通主键，可以直接MODIFY
    MODIFY (p_tabnam) FROM TABLE <lt_data>[].
  ELSE.
    " 全主键，需要删除再插入
    DELETE (p_tabnam) FROM TABLE <lt_data>[].
    IF sy-subrc = 0.
      INSERT (p_tabnam) FROM TABLE <lt_data>[].
    ENDIF.
  ENDIF.

  IF sy-subrc = 0.
    COMMIT WORK AND WAIT.
    DATA(l_msg) = |已处理，共[{ lines( <lt_data> ) }]行|.
    MESSAGE l_msg TYPE 'S'.
  ELSE.
    ROLLBACK WORK.
    l_msg = |处理失败|.
    MESSAGE l_msg TYPE 'S' DISPLAY LIKE 'E'.
  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_display
*&---------------------------------------------------------------------*
*& 数据展示
*&---------------------------------------------------------------------*
FORM frm_display.

  DATA ls_layout TYPE lvc_s_layo.
  DATA lt_fieldcat TYPE lvc_t_fcat.

  PERFORM frm_set_layout CHANGING ls_layout.
  PERFORM frm_set_fieldcat TABLES lt_fieldcat.
  lt_fieldcat = gt_fieldcat.

  FIELD-SYMBOLS <fs_data_tab> TYPE STANDARD TABLE.
  ASSIGN gr_data_tab->* TO <fs_data_tab>.

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
      t_outtab                 = <fs_data_tab>[]
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
*& 默认布局
*&---------------------------------------------------------------------*
FORM frm_set_layout CHANGING cs_layout TYPE lvc_s_layo.

  CLEAR cs_layout.
  cs_layout-zebra = abap_true. " 斑马线
  cs_layout-cwidth_opt = abap_true. " 自动调整ALVL列宽
  cs_layout-sel_mode = 'A'. " 选择模式

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_fieldcat
*&---------------------------------------------------------------------*
*& 字段目录
*&---------------------------------------------------------------------*
FORM frm_set_fieldcat TABLES ct_fieldcat TYPE lvc_t_fcat.

  ct_fieldcat[] = gt_fieldcat.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_fieldcat_fields
*&---------------------------------------------------------------------*
*& 更新字段ALV的字段目录
*&---------------------------------------------------------------------*
FORM frm_set_fieldcat_fields TABLES ct_fieldcat TYPE lvc_t_fcat.

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

  _init_fieldcat 'ZSEL' '更新项' '' ''.
  _init_fieldcat 'ZNAME' '字段名' '' ''.
  _init_fieldcat 'ZTEXT' '字段描述' '' ''.
  _init_fieldcat 'ZKEY' '主键' '' ''.

  LOOP AT ct_fieldcat REFERENCE INTO DATA(lr_fieldcat).
    IF lr_fieldcat->fieldname = 'ZSEL'
    OR lr_fieldcat->fieldname = 'ZKEY'
      .
      lr_fieldcat->checkbox = abap_true.
    ENDIF.

    IF lr_fieldcat->fieldname = 'ZSEL'.
      lr_fieldcat->edit = abap_true.
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

  " 获取ALV选取行
  CLEAR gt_rows.
  CALL METHOD lo_grid->get_selected_rows
    IMPORTING
      et_index_rows = gt_rows.

  " 按钮功能实现
  CASE cv_ucomm.
    WHEN 'IMPORT'.
*      PERFORM frm_display_fields.
      PERFORM frm_import.
    WHEN OTHERS.
  ENDCASE.

  " 刷新ALV 显示值
  cs_selfield-refresh = abap_true .
  cs_selfield-row_stable = abap_true .
  cs_selfield-col_stable = abap_true .

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_display_fields
*&---------------------------------------------------------------------*
*& 弹窗展示选取更新列ALV
*&---------------------------------------------------------------------*
FORM frm_display_fields .

  CLEAR gt_field.

  DATA ls_field TYPE ty_field.
  LOOP AT gt_fieldcat INTO DATA(ls_fieldcat).
    CLEAR ls_field.
    ls_field-zname = ls_fieldcat-fieldname.
    ls_field-ztext = ls_fieldcat-scrtext_l.
    ls_field-zkey = ls_fieldcat-key.
    IF ls_field-zkey IS NOT INITIAL.
      ls_field-zsel = abap_true.
    ENDIF.
    INSERT ls_field INTO TABLE gt_field.
  ENDLOOP.

  " 事件
  IF go_event_handler IS NOT BOUND.
    go_event_handler = NEW #( ).
  ENDIF.

  " 弹窗容器
  IF go_con_fields IS NOT BOUND.
    go_con_fields = NEW cl_gui_dialogbox_container(
        width  = 480
        height = 320
        top    = 5
        left   = 240 ).
    SET HANDLER go_event_handler->on_dialogbox_close FOR go_con_fields.
  ENDIF.

  " ALV GRID
  IF go_grid_fields IS NOT BOUND.
    DATA ls_layout TYPE lvc_s_layo.
    DATA lt_fieldcat TYPE STANDARD TABLE OF lvc_s_fcat.

    PERFORM frm_set_layout CHANGING ls_layout.
    PERFORM frm_set_fieldcat_fields TABLES lt_fieldcat.

    go_grid_fields = NEW #( go_con_fields ).

    CALL METHOD go_grid_fields->set_table_for_first_display
      EXPORTING
        is_layout                     = ls_layout
      CHANGING
        it_outtab                     = gt_field
        it_fieldcatalog               = lt_fieldcat
      EXCEPTIONS
        invalid_parameter_combination = 1
        program_error                 = 2
        too_many_lines                = 3
        OTHERS                        = 4.
    SET HANDLER go_event_handler->on_toolbar FOR go_grid_fields.
    SET HANDLER go_event_handler->on_user_command FOR go_grid_fields.
  ELSE.
    go_grid_fields->refresh_table_display( is_stable = CONV #( 'XX' ) ).
  ENDIF.

  go_con_fields->set_visible( cl_gui_dialogbox_container=>visible_true ).

ENDFORM.

*&---------------------------------------------------------------------*
*&
*&---------------------------------------------------------------------*
START-OF-SELECTION.
  PERFORM frm_main.

```

</details>
