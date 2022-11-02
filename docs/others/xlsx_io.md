# EXCEL上传下载

整理下常用的方法。

## CL_EHFND_XLSX

SAP的内置方法，通过解析XLSX中的XML文件，实现高速读取数据，首推。

<details>
    <summary>示例代码</summary>

```ABAP

TYPES:
  BEGIN OF ty_data,
    field1 TYPE string,
    field2 TYPE string,
  END OF ty_data.

DATA:
  lt_data TYPE STANDARD TABLE OF ty_data,
  ls_data TYPE ty_data.

" 获取上传文件路径
DATA(l_file) = cl_openxml_helper=>browse_local_file_open(
    iv_title      = 'Choose'
    iv_filename   = 'Import.xlsx'
    iv_extpattern = '*.xlsx|*.xlsx' ).

TRY.
    " 获取文件内容
    DATA(l_buffer) = cl_openxml_helper=>load_local_file( l_file ).
    " 解析文件
    DATA(lo_xlsx) = cl_ehfnd_xlsx=>get_instance( ).
    DATA(lo_doc) = lo_xlsx->load_doc( l_buffer ).
    DATA(lt_sheet_info) = lo_doc->get_sheets( ).
    DATA(lo_sheet) = lo_doc->get_sheet_by_id( lt_sheet_info[ 1 ]-sheet_id ).
  CATCH cx_openxml_format
      cx_openxml_not_found
      cx_openxml_not_allowed.
    RETURN.
ENDTRY.

" 获取上传行数
DATA l_row TYPE i.
DATA l_row_last TYPE i.
l_row_last = lo_sheet->get_last_row_number( ).
l_row = 1. " 跳过抬头行

" 逐行处理
WHILE l_row < l_row_last.
  l_row = l_row + 1.
  CLEAR ls_data.
  ls_data-field1 = lo_sheet->get_cell_content( iv_row = l_row iv_column = 1 ).
  ls_data-field2 = lo_sheet->get_cell_content( iv_row = l_row iv_column = 2 ).
  INSERT ls_data INTO TABLE lt_data.
ENDWHILE.

```

</details>

### 封装简化

CL_EHFND_XLSX使用上比其他方法都显得繁琐，不妨写些工具代码来简化。

<details>
    <summary>ZCL_XLSX_IO</summary>

```ABAP

CLASS zcl_xlsx_io DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC .

  PUBLIC SECTION.

    DATA mo_xlsx TYPE REF TO cl_ehfnd_xlsx .
    DATA mo_doc TYPE REF TO if_ehfnd_xlsx_doc .
    DATA mo_sheet TYPE REF TO if_ehfnd_xlsx_sheet .

    CLASS-METHODS download_smw0_templete
      IMPORTING
        !i_objid TYPE w3objid
        !i_name  TYPE string OPTIONAL .
    CLASS-METHODS get_smw0_templete
      IMPORTING
        !i_objid        TYPE w3objid
      RETURNING
        VALUE(r_buffer) TYPE xstring .
    CLASS-METHODS replace_sharedstrings
      IMPORTING
        !it_replace TYPE ANY TABLE
      CHANGING
        !c_doc      TYPE xstring.
    CLASS-METHODS get_local_file
      IMPORTING
        !i_filename     TYPE string OPTIONAL
      RETURNING
        VALUE(r_buffer) TYPE xstring .
    CLASS-METHODS import
      IMPORTING
        !i_filename TYPE string OPTIONAL
        !i_skip_row TYPE i DEFAULT 1
      CHANGING
        !ct_data    TYPE ANY TABLE .
    CLASS-METHODS export
      IMPORTING
        !i_filename TYPE string OPTIONAL
        !it_data    TYPE ANY TABLE .
    CLASS-METHODS get_instance
      IMPORTING
        !i_buffer          TYPE xstring OPTIONAL
      RETURNING
        VALUE(ro_instance) TYPE REF TO zcl_xlsx_io .
    CLASS-METHODS get_reader
      IMPORTING
        !i_filename        TYPE string OPTIONAL
      RETURNING
        VALUE(ro_instance) TYPE REF TO zcl_xlsx_io .
    CLASS-METHODS get_writer
      RETURNING
        VALUE(ro_instance) TYPE REF TO zcl_xlsx_io .
    CLASS-METHODS conv
      IMPORTING
        !dataflow TYPE string
        !convexit TYPE string OPTIONAL
        !input    TYPE data
      EXPORTING
        !output   TYPE data .
    METHODS start
      IMPORTING
        !i_row    TYPE i OPTIONAL
        !i_column TYPE i OPTIONAL .
    METHODS stop .
    METHODS row_id
      RETURNING
        VALUE(r_row) TYPE i .
    METHODS column_id
      RETURNING
        VALUE(r_column) TYPE i .
    METHODS has_next_row
      RETURNING
        VALUE(r_flag) TYPE abap_bool .
    METHODS has_next_column
      RETURNING
        VALUE(r_flag) TYPE abap_bool .
    METHODS next_row
      IMPORTING
        !i_row TYPE i DEFAULT 1 .
    METHODS next_column
      IMPORTING
        !i_column TYPE i DEFAULT 1 .
    METHODS read_column
      IMPORTING
        !i_column      TYPE i
      EXPORTING
        !e_value       TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS read_next_column
      EXPORTING
        !e_value       TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS write_column
      IMPORTING
        !i_value  TYPE data
        !i_conv   TYPE xfeld DEFAULT abap_false
        !i_column TYPE i .
    METHODS write_next_column
      IMPORTING
        !i_value TYPE data
        !i_conv  TYPE xfeld DEFAULT abap_false .
    METHODS save
      IMPORTING
        !i_filename TYPE string OPTIONAL .
  PROTECTED SECTION.
  PRIVATE SECTION.
    DATA m_row TYPE i.
    DATA m_column TYPE i.
    DATA m_row_last TYPE i.
    DATA m_column_last TYPE i.
ENDCLASS.



CLASS zcl_xlsx_io IMPLEMENTATION.


  METHOD column_id.

    r_column = m_column.

  ENDMETHOD.


  METHOD conv.

    DATA l_subrc TYPE subrc VALUE 4.
    DATA l_value TYPE string.
    DATA l_convexit TYPE string.
    DATA l_fm_convexit TYPE rs38l_fnam. " 转换例程函数

    DESCRIBE FIELD output TYPE DATA(l_type) EDIT MASK DATA(l_mask).

    " EDIT MASK取出来的值如：==ALPHA、==MATN1
    CLEAR l_convexit.
    IF convexit IS SUPPLIED.
      l_convexit = convexit.
    ELSEIF strlen( l_mask ) > 2.
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

  ENDMETHOD.


  METHOD download_smw0_templete.

    DATA: ls_wwwdatatab       TYPE wwwdatatab,
          l_rc                TYPE sy-subrc,
          l_defaultfilename   TYPE string,
          ls_wwwdata_tab      TYPE wwwdatatab,
          l_object_name       TYPE w3objid,
          l_filename          TYPE string,
          l_default_file_name TYPE string,
          l_fullpath          TYPE string,
          l_down_path         TYPE localfile,
          ls_wwwdata          TYPE wwwdata,
          l_path              TYPE string.

    l_default_file_name = i_name.

    CALL METHOD cl_gui_frontend_services=>file_save_dialog
      EXPORTING
        window_title         = '选择本地文件保存路径'
        default_file_name    = l_default_file_name
        default_extension    = '*.xlsx'
        file_filter          = 'EXCEL FILES(*.xlsx)|*.xlsx'
      CHANGING
        filename             = l_filename
        path                 = l_path
        fullpath             = l_fullpath
      EXCEPTIONS
        cntl_error           = 1
        error_no_gui         = 2
        not_supported_by_gui = 3
        OTHERS               = 5.
    IF sy-subrc <> 0.
      RETURN.
    ENDIF.

    SELECT SINGLE *
       FROM wwwdata
      INNER JOIN tadir
         ON wwwdata~objid = tadir~obj_name
       INTO CORRESPONDING FIELDS OF ls_wwwdata_tab
      WHERE wwwdata~srtf2  = 0
        AND wwwdata~relid  = 'MI'
        AND tadir~pgmid    = 'R3TR'
        AND tadir~object   = 'W3MI'
        AND tadir~obj_name = i_objid.
    IF sy-subrc <> 0.
      MESSAGE |模板文件[{ i_objid }]不存在| TYPE 'S' DISPLAY LIKE 'E'.
      RETURN.
    ENDIF.

    l_down_path = l_fullpath.
    CALL FUNCTION 'DOWNLOAD_WEB_OBJECT'
      EXPORTING
        key         = ls_wwwdata_tab
        destination = l_down_path
      IMPORTING
        rc          = l_rc.
    IF sy-subrc = 0.
      MESSAGE |模板下载成功| TYPE 'S'.
    ELSE.
      MESSAGE |模板下载失败| TYPE 'S'.
    ENDIF.

  ENDMETHOD.


  METHOD export.

    DATA lo_tabledescr TYPE REF TO cl_abap_tabledescr.
    DATA lo_structdescr TYPE REF TO cl_abap_structdescr.
    lo_tabledescr ?= cl_abap_typedescr=>describe_by_data( it_data ).
    lo_structdescr ?= lo_tabledescr->get_table_line_type( ).

    " 获取内表信息
    DATA(lt_component) = lo_structdescr->get_components( ).
    " 深度结构处理太麻烦，不考虑了，有需要可以自己调整
    DELETE lt_component WHERE type IS NOT INSTANCE OF cl_abap_elemdescr.
    IF lt_component IS INITIAL.
      MESSAGE '导出失败' TYPE 'S' DISPLAY LIKE 'E'.
      RETURN.
    ENDIF.

    DATA(lo_writer) = zcl_xlsx_io=>get_instance( ).
    lo_writer->start( ). " 准备写入

    " 写入抬头文本行
    lo_writer->next_row( ).
    LOOP AT lt_component INTO DATA(ls_component).
      lo_writer->write_next_column( ls_component-name ).
    ENDLOOP.

    " 写入数据行
    LOOP AT it_data ASSIGNING FIELD-SYMBOL(<ls_data>).
      lo_writer->next_row( ).
      LOOP AT lt_component INTO ls_component.
        FIELD-SYMBOLS <fs_field> TYPE any.
        ASSIGN COMPONENT ls_component-name OF STRUCTURE <ls_data> TO <fs_field>.
        IF <fs_field> IS ASSIGNED.
          lo_writer->write_next_column( <fs_field> ).
          UNASSIGN <fs_field>.
        ELSE.
          lo_writer->next_column( ).
        ENDIF.
      ENDLOOP.
    ENDLOOP.

    " 导出到本地
    lo_writer->save( i_filename = i_filename ).

  ENDMETHOD.


  METHOD get_instance.

    ro_instance = NEW #( ).
    TRY.
        ro_instance->mo_xlsx = cl_ehfnd_xlsx=>get_instance( ).
        IF i_buffer IS SUPPLIED.
          ro_instance->mo_doc = ro_instance->mo_xlsx->load_doc( iv_file_data = i_buffer ).
        ELSE.
          ro_instance->mo_doc = ro_instance->mo_xlsx->create_doc( ).
        ENDIF.
        DATA(lt_sheet_info) = ro_instance->mo_doc->get_sheets( ).
        ro_instance->mo_sheet = ro_instance->mo_doc->get_sheet_by_id( lt_sheet_info[ 1 ]-sheet_id ).
      CATCH
        cx_openxml_format
        cx_openxml_not_found
        cx_openxml_not_allowed.
        CLEAR ro_instance.
    ENDTRY.

  ENDMETHOD.


  METHOD get_local_file.

    DATA l_filename TYPE string.
    IF i_filename IS NOT INITIAL.
      l_filename = i_filename.
    ELSE.
      l_filename = cl_openxml_helper=>browse_local_file_open(
          iv_title      = 'Choose'
          iv_filename   = 'Import.xlsx'
          iv_extpattern = '*.xlsx|*.xlsx' ).
    ENDIF.
    CHECK l_filename IS NOT INITIAL.

    TRY.
        r_buffer = cl_openxml_helper=>load_local_file( l_filename ).
      CATCH cx_openxml_not_found.
        CLEAR r_buffer.
    ENDTRY.

  ENDMETHOD.


  METHOD get_reader.

    DATA(l_buffer) = zcl_xlsx_io=>get_local_file( i_filename ).
    ro_instance = zcl_xlsx_io=>get_instance( i_buffer = l_buffer ).

  ENDMETHOD.


  METHOD get_smw0_templete.

    DATA: lt_mime TYPE STANDARD TABLE OF w3mime,
          ls_id   TYPE wwwdataid,
          ls_key  TYPE wwwdatatab.

    ls_key-relid ='MI'.
    ls_key-objid = i_objid.

    CALL FUNCTION 'WWWDATA_IMPORT'
      EXPORTING
        key               = ls_key
      TABLES
        mime              = lt_mime
      EXCEPTIONS
        wrong_object_type = 1
        import_error      = 2
        OTHERS            = 3.
    IF sy-subrc <> 0.
      MESSAGE |模板[{ i_objid }]获取失败| TYPE 'S' DISPLAY LIKE 'E'.
      RETURN.
    ENDIF.

    SELECT SINGLE value FROM wwwparams
      WHERE relid = @ls_key-relid
        AND objid = @ls_key-objid
      AND name EQ 'filesize'
    INTO @DATA(l_param).

    DATA l_length TYPE i.
    l_length = l_param.

    CALL FUNCTION 'SCMS_BINARY_TO_XSTRING'
      EXPORTING
        input_length = l_length
      IMPORTING
        buffer       = r_buffer
      TABLES
        binary_tab   = lt_mime
      EXCEPTIONS
        failed       = 1
        OTHERS       = 2.
    IF sy-subrc <> 0.
      CLEAR r_buffer.
    ENDIF.

  ENDMETHOD.


  METHOD get_writer.

    ro_instance = get_instance( ).

  ENDMETHOD.


  METHOD has_next_column.

    r_flag = xsdbool( m_column_last > m_column ).

  ENDMETHOD.


  METHOD has_next_row.

    r_flag = xsdbool( m_row_last > m_row ).

  ENDMETHOD.


  METHOD import.

    DATA lr_data TYPE REF TO data.
    FIELD-SYMBOLS <fs_data> TYPE any.
    FIELD-SYMBOLS <fs_field> TYPE any.

    " 构造工作区
    CREATE DATA lr_data LIKE LINE OF ct_data[].
    ASSIGN lr_data->* TO <fs_data>.
    CHECK <fs_data> IS ASSIGNED.

    DATA(l_buffer) = get_local_file( i_filename = i_filename ).
    CHECK l_buffer IS NOT INITIAL.

    DATA(lo_reader) = zcl_xlsx_io=>get_instance( i_buffer = l_buffer ).
    CHECK lo_reader IS NOT INITIAL.

    " 准备读取
    lo_reader->start( ).

    " 跳过抬头行
    DO i_skip_row TIMES.
      lo_reader->next_row( ).
    ENDDO.

    " 读取数据行
    WHILE lo_reader->has_next_row( ) = abap_true.
      lo_reader->next_row( ).
      CLEAR <fs_data>.
      DO.
        ASSIGN COMPONENT sy-index OF STRUCTURE <fs_data> TO <fs_field>.
        IF <fs_field> IS ASSIGNED.
          <fs_field> = lo_reader->read_next_column( ).
          UNASSIGN <fs_field>.
        ELSE.
          EXIT.
        ENDIF.
      ENDDO.
      INSERT <fs_data> INTO TABLE ct_data.
    ENDWHILE.

  ENDMETHOD.


  METHOD next_column.

    m_column = m_column + i_column.

  ENDMETHOD.


  METHOD next_row.

    m_row = m_row + i_row.
    CLEAR m_column.
    m_column_last = mo_sheet->get_last_column_number_in_row( m_row ).

  ENDMETHOD.


  METHOD read_column.

    r_value = mo_sheet->get_cell_content( iv_row    = m_row
                                          iv_column = i_column ).
    IF e_value IS SUPPLIED.
      me->conv(
        EXPORTING
          dataflow = 'INPUT'
          input    = r_value
        IMPORTING
          output   = e_value
      ).
    ENDIF.

  ENDMETHOD.


  METHOD read_next_column.

    next_column( ).
    r_value = read_column( m_column ).
    IF e_value IS SUPPLIED.
      me->conv(
        EXPORTING
          dataflow = 'INPUT'
          input    = r_value
        IMPORTING
          output   = e_value
      ).
    ENDIF.

  ENDMETHOD.


  METHOD row_id.

    r_row = m_row.

  ENDMETHOD.


  METHOD save.

    DATA l_filename TYPE string.
    IF i_filename IS NOT INITIAL.
      l_filename = i_filename.
    ELSE.
      l_filename = cl_openxml_helper=>browse_local_file_save(
          iv_title      = 'Save as'
          iv_filename   = 'Export.xlsx'
          iv_extpattern = '*.xlsx|*.xlsx' ).
    ENDIF.
    CHECK l_filename IS NOT INITIAL.

    TRY.
        cl_openxml_helper=>store_local_file(
            im_file_name = l_filename
            im_data      = mo_doc->save( ) ).
      CATCH
        cx_openxml_format
        cx_openxml_not_found
        cx_openxml_not_allowed
        cx_dynamic_check
        INTO DATA(lx_openxml).
        MESSAGE lx_openxml->get_longtext( ) TYPE 'S' DISPLAY LIKE 'E'.
    ENDTRY.

  ENDMETHOD.


  METHOD start.

    m_row_last = mo_sheet->get_last_row_number( ).
    m_row = i_row.
    m_column = i_column.

  ENDMETHOD.


  METHOD stop.

    m_row = m_row_last.
    IF m_row > 0.
      m_column_last = mo_sheet->get_last_column_number_in_row( m_row ).
      m_column = m_column_last.
    ENDIF.

  ENDMETHOD.


  METHOD write_column.

    DATA l_value TYPE string.
    IF i_conv = abap_true.
      me->conv(
        EXPORTING
          dataflow = 'OUTPUT'
          input    = i_value
        IMPORTING
          output   = l_value
      ).
    ELSE.
      l_value = i_value.
    ENDIF.
    mo_sheet->set_cell_content( iv_row    = m_row
                                iv_column = i_column
                                iv_value  = l_value ).

  ENDMETHOD.


  METHOD write_next_column.

    next_column( ).
    write_column( i_column = m_column
                  i_conv = i_conv
                  i_value  = i_value ).

  ENDMETHOD.


  METHOD replace_sharedstrings.

    " 程序要求IT_REPLACE至少两列，代码会将左列内容替换为右列内容
    CHECK it_replace IS NOT INITIAL.
    CHECK c_doc IS NOT INITIAL.

    FIELD-SYMBOLS <fs_replace_t> TYPE ANY TABLE.
    FIELD-SYMBOLS <fs_replace> TYPE any.
    FIELD-SYMBOLS <fs_from> TYPE any.
    FIELD-SYMBOLS <fs_to> TYPE any.

    TRY.
        DATA(lo_doc) = cl_xlsx_document=>load_document( c_doc ).
        DATA(lo_workbook_part) = lo_doc->get_workbookpart( ).
        DATA(lo_sharedstrings_part) = lo_workbook_part->get_sharedstringspart( ).

        DATA(l_sharedstrings_xml) = lo_sharedstrings_part->get_data( ).
        DATA(l_sharedstrings_str) = cl_openxml_helper=>xstring_to_string( l_sharedstrings_xml ).

        ASSIGN it_replace TO <fs_replace_t>.
        LOOP AT <fs_replace_t> ASSIGNING <fs_replace>.
          ASSIGN COMPONENT 1 OF STRUCTURE <fs_replace> TO <fs_from> .
          ASSIGN COMPONENT 2 OF STRUCTURE <fs_replace> TO <fs_to> .
          IF <fs_from> IS ASSIGNED AND <fs_to> IS ASSIGNED.
            IF <fs_from> IS NOT INITIAL.
              REPLACE ALL OCCURRENCES OF <fs_from> IN l_sharedstrings_str WITH <fs_to> IN CHARACTER MODE.
            ENDIF.
          ENDIF.
          UNASSIGN <fs_from>.
          UNASSIGN <fs_to>.
        ENDLOOP.

        l_sharedstrings_xml = cl_openxml_helper=>string_to_xstring( l_sharedstrings_str ).
        lo_sharedstrings_part->feed_data( l_sharedstrings_xml ).

        c_doc = lo_doc->get_package_data( ).

      CATCH cx_openxml_not_found
            cx_openxml_format
            cx_openxml_not_allowed
            INTO DATA(lx_openxml).
        MESSAGE lx_openxml->get_text( ) TYPE 'S' DISPLAY LIKE 'E'.
      CATCH cx_root INTO DATA(lx_root).
        MESSAGE lx_root->get_text( ) TYPE 'S' DISPLAY LIKE 'E'.
    ENDTRY.

  ENDMETHOD.

ENDCLASS.

```

</details>

<details>
    <summary>示例代码</summary>

```ABAP

TYPES:
  BEGIN OF ty_data,
    field1 TYPE string,
    field2 TYPE string,
  END OF ty_data.
DATA lt_data TYPE STANDARD TABLE OF ty_data.

lt_data = VALUE #(
  ( field1 = 'A1' field2 = 'B1' )
  ( field1 = 'A2' field2 = 'B2' )
).

" 导出
zcl_xlsx_io=>export( lt_data ).

" 导入
CLEAR lt_data.
zcl_xlsx_io=>import( CHANGING ct_data = lt_data ).

```

</details>

### 文本替换

对于固定模板文件，不妨直接替换里面的文本内容

<details>
  <summary>示例代码</summary>

```ABAP

DATA(l_buffer) = zcl_xlsx_io=>get_smw0_templete( CONV #( sy-tcode ) ). " 获取SMW0模板文件

TRY.
    DATA(lo_doc) = cl_xlsx_document=>load_document( l_buffer ).
    DATA(lo_workbook_part) = lo_doc->get_workbookpart( ).
    DATA(lo_sharedstrings_part) = lo_workbook_part->get_sharedstringspart( ).

    " 直接替换即可
    " 也试过解析XML文件，但富文本格式难以处理
    DATA(l_sharedstrings_xml) = lo_sharedstrings_part->get_data( ).
    LOOP AT lt_replace INTO DATA(ls_replace).
      DATA(l_from) = cl_openxml_helper=>string_to_xstring( ls_replace-from ).
      IF l_from IS NOT INITIAL.
        DATA(l_to) = cl_openxml_helper=>string_to_xstring( ls_replace-to ).
        REPLACE ALL OCCURRENCES OF l_from IN l_sharedstrings_xml WITH l_to IN BYTE MODE.
      ENDIF.
      CLEAR l_from.
      CLEAR l_to.
    ENDLOOP.
    lo_sharedstrings_part->feed_data( l_sharedstrings_xml ). " 回写

    l_buffer = lo_doc->get_package_data( ). " 获取替换后的文件

  CATCH cx_openxml_not_found
        cx_openxml_format
        cx_openxml_not_allowed
        INTO DATA(lx_openxml).
    MESSAGE lx_openxml->get_text( ) TYPE 'S' DISPLAY LIKE 'E'.
ENDTRY.

```

</details>

## ABAP2XLSX

第三方工具，通过解析XLSX中的XML文件，实现高速读取数据。相比CL_EHFND_XLSX，提供了更齐全的样式设置。

> <https://github.com/abap2xlsx/abap2xlsx/releases>

## XLSX WORKBANCH

第三方工具，类似SMARTFORMS，预先设置好EXCEL模板与输入参数，随后可在程序中直接调用获取，适合导出特定格式的需求。

## TEXT_CONVERT_XLS_TO_SAP

该方法可将EXCEL内容直接映射到ABAP内表中。

<details>
    <summary>示例代码</summary>

```ABAP

TYPES:
  BEGIN OF ty_data,
    field1 TYPE string,
    field2 TYPE string,
  END OF ty_data.
TYPES tt_data TYPE STANDARD TABLE OF ty_data.

DATA lt_data TYPE tt_data.
DATA lt_raw TYPE truxs_t_text_data.

CALL FUNCTION 'TEXT_CONVERT_XLS_TO_SAP'
  EXPORTING
    i_line_header        = abap_false
    i_tab_raw_data       = lt_raw
    i_filename           = 'C:\import.xls'
  TABLES
    i_tab_converted_data = lt_data
  EXCEPTIONS
    conversion_failed    = 1
    OTHERS               = 2.

```

</details>

## ALSM_EXCEL_TO_INTERNAL_TABLE

该方法可获取EXCEL单元格内容，处理灵活。

<details>
    <summary>示例代码</summary>

```ABAP

TYPES:
  BEGIN OF ty_data,
    field1 TYPE string,
    field2 TYPE string,
  END OF ty_data.
TYPES tt_data TYPE STANDARD TABLE OF ty_data.

DATA lt_data TYPE tt_data.
DATA ls_data TYPE ty_data.

DATA lt_intern TYPE STANDARD TABLE OF alsmex_tabline.
DATA ls_intern TYPE alsmex_tabline.

CALL FUNCTION 'ALSM_EXCEL_TO_INTERNAL_TABLE'
  EXPORTING
    filename                = 'C:\import.xls'
    i_begin_col             = 1
    i_begin_row             = 2 " 跳过首行
    i_end_col               = 2
    i_end_row               = 9999
  TABLES
    intern                  = lt_intern
  EXCEPTIONS
    inconsistent_parameters = 1
    upload_ole              = 2
    OTHERS                  = 3.

SORT lt_intern BY row col.
LOOP AT lt_intern INTO ls_intern.
  AT NEW row.
    CLEAR ls_data.
  ENDAT.
  CASE ls_intern-col.
    WHEN '0001'.
      ls_data-field1 = ls_intern-value.
    WHEN '0002'.
      ls_data-field2 = ls_intern-value.
    WHEN OTHERS.
  ENDCASE.
  AT END OF row.
    INSERT ls_data INTO TABLE lt_data.
  ENDAT.
ENDLOOP.

```

</details>

## OLE

上古工具，建议放弃

## DOI

没用过，不懂
