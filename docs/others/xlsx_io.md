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
    CLASS-METHODS import CHANGING ct_data TYPE ANY TABLE.
    CLASS-METHODS export IMPORTING it_data TYPE ANY TABLE.
    CLASS-METHODS get_writer IMPORTING i_file           TYPE string OPTIONAL
                             RETURNING VALUE(ro_writer) TYPE REF TO zcl_xlsx_io.
    CLASS-METHODS get_reader IMPORTING i_file           TYPE string OPTIONAL
                             RETURNING VALUE(ro_reader) TYPE REF TO zcl_xlsx_io.
    METHODS start IMPORTING i_row    TYPE i OPTIONAL
                            i_column TYPE i OPTIONAL.
    METHODS row_id RETURNING VALUE(r_row) TYPE i.
    METHODS column_id RETURNING VALUE(r_column) TYPE i.
    METHODS has_next_row RETURNING VALUE(r_flag) TYPE abap_bool.
    METHODS next_row IMPORTING i_row TYPE i DEFAULT 1.
    METHODS next_column IMPORTING i_column TYPE i DEFAULT 1.
    METHODS read_next_column RETURNING VALUE(r_value) TYPE string.
    METHODS write_next_column IMPORTING i_value TYPE data.
    METHODS save.

  PROTECTED SECTION.
  PRIVATE SECTION.
    DATA mo_xlsx TYPE REF TO cl_ehfnd_xlsx.
    DATA mo_doc TYPE REF TO if_ehfnd_xlsx_doc.
    DATA mt_sheet_info TYPE cl_ehfnd_xlsx=>gty_th_sheet_info.
    DATA mo_sheet TYPE REF TO if_ehfnd_xlsx_sheet.

    DATA m_row_last TYPE i.
    DATA m_row TYPE i.
    DATA m_column TYPE i.
ENDCLASS.



CLASS zcl_xlsx_io IMPLEMENTATION.

  METHOD get_reader.

    DATA l_file TYPE string.
    IF i_file IS SUPPLIED.
      l_file = i_file.
    ELSE.
      l_file = cl_openxml_helper=>browse_local_file_open(
          iv_title      = 'Choose'
          iv_filename   = 'Import.xlsx'
          iv_extpattern = '*.xlsx|*.xlsx' ).
    ENDIF.

    TRY.
        DATA(l_buffer) = cl_openxml_helper=>load_local_file( l_file ).
      CATCH cx_openxml_not_found.
        RETURN.
    ENDTRY.

    ro_reader = NEW #( ).

    TRY.
        ro_reader->mo_xlsx = cl_ehfnd_xlsx=>get_instance( ).
        ro_reader->mo_doc = ro_reader->mo_xlsx->load_doc( l_buffer ).
        ro_reader->mt_sheet_info = ro_reader->mo_doc->get_sheets( ).
        ro_reader->mo_sheet = ro_reader->mo_doc->get_sheet_by_id( ro_reader->mt_sheet_info[ 1 ]-sheet_id ).
      CATCH
        cx_openxml_format
        cx_openxml_not_found
        cx_openxml_not_allowed.
    ENDTRY.

  ENDMETHOD.

  METHOD get_writer.

    IF i_file IS SUPPLIED.
      ro_writer = get_reader( i_file ).
      RETURN.
    ENDIF.

    ro_writer = NEW #( ).

    TRY.
        ro_writer->mo_xlsx = cl_ehfnd_xlsx=>get_instance( ).
        ro_writer->mo_doc = ro_writer->mo_xlsx->create_doc( ).
        ro_writer->mt_sheet_info = ro_writer->mo_doc->get_sheets( ).
        ro_writer->mo_sheet = ro_writer->mo_doc->get_sheet_by_id( ro_writer->mt_sheet_info[ 1 ]-sheet_id ).
      CATCH
        cx_openxml_format
        cx_openxml_not_found
        cx_openxml_not_allowed.
    ENDTRY.

  ENDMETHOD.

  METHOD start.

    m_row_last = mo_sheet->get_last_row_number( ).
    m_row = i_row.
    m_column = i_column.

  ENDMETHOD.

  METHOD row_id.

    r_row = m_row.

  ENDMETHOD.

  METHOD column_id.

    r_column = m_column.

  ENDMETHOD.

  METHOD has_next_row.

    r_flag = xsdbool( m_row_last > m_row ).

  ENDMETHOD.

  METHOD next_row.

    m_row = m_row + i_row.
    CLEAR m_column.

  ENDMETHOD.

  METHOD next_column.

    m_column = m_column + i_column.

  ENDMETHOD.

  METHOD read_next_column.

    next_column( ).
    r_value = mo_sheet->get_cell_content( iv_row    = m_row
                                          iv_column = m_column ).

  ENDMETHOD.

  METHOD write_next_column.

    next_column( ).
    mo_sheet->set_cell_content( iv_row    = m_row
                                iv_column = m_column
                                iv_value  = i_value ).

  ENDMETHOD.

  METHOD save.

    DATA(l_filename) = cl_openxml_helper=>browse_local_file_save(
        iv_title      = 'Save as'
        iv_filename   = 'Export.xlsx'
        iv_extpattern = '*.xlsx|*.xlsx' ).
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

    DATA(lo_writer) = zcl_xlsx_io=>get_writer( ).
    " 准备写入
    lo_writer->start( ).

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
    lo_writer->save( ).

  ENDMETHOD.

  METHOD import.

    DATA lr_data TYPE REF TO data.
    FIELD-SYMBOLS <fs_data> TYPE any.
    FIELD-SYMBOLS <fs_field> TYPE any.

    " 构造工作区
    CREATE DATA lr_data LIKE LINE OF ct_data[].
    ASSIGN lr_data->* TO <fs_data>.
    CHECK <fs_data> IS ASSIGNED.

    DATA(lo_reader) = zcl_xlsx_io=>get_reader( ).
    " 准备读取
    lo_reader->start( ).

    " 跳过抬头行
    lo_reader->next_row( ).

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

## ABAP2XLSX

第三方工具，通过解析XLSX中的XML文件，实现高速读取数据。相比CL_EHFND_XLSX，提供了更齐全的样式设置。

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

## XLSX WORKBANCH

第三方工具，类似SMARTFORMS，预先设置好EXCEL模板与输入参数，随后可在程序中直接调用获取，适合导出特定格式的需求。

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
