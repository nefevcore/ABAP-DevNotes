# 财务报表导出

## XLSX格式导出

XLSX格式，或者说Openxml格式，会将文本全部存入到Sharedstrings.xml文件中，因此通过替换Sharedstrings中的文本内容，即可实现文本替换。

<details>
  <summary>Openxml替换Sharedstrings内容</summary>

```ABAP

*&---------------------------------------------------------------------*
*& 替换模板文件中的文本内容
*&---------------------------------------------------------------------*
METHOD replace_texts.

  " 程序要求IT_REPLACE至少两列，代码会将左列内容替换为右列内容
  CHECK it_replace IS NOT INITIAL.
  " 模板文件不能为空
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

```

</details>

## XLS格式导出

如果模板是XLS格式，使用OLE进行替换：

<details>
  <summary>OLE替换文本内容</summary>

```ABAP

TYPE-POOLS ole2.
DATA:
  l_app       TYPE ole2_object,
  l_workbooks TYPE ole2_object,
  l_cells     TYPE ole2_object.

CREATE OBJECT l_app 'EXCEL.APPLICATION'.
SET PROPERTY OF l_app 'DisplayAlerts' = 0.
CALL METHOD OF l_app 'Workbooks' = l_workbooks.
CALL METHOD OF l_workbooks 'Open'
  EXPORTING
    #1 = filename.
GET PROPERTY OF l_app 'Cells' = l_cells.

FIELD-SYMBOLS:
  <fs_replace>  TYPE any,
  <fs_from> TYPE any,
  <fs_to> TYPE any.

LOOP AT it_replace ASSIGNING <fs_replace>.
  ASSIGN COMPONENT 1 OF STRUCTURE <fs_replace> TO <fs_from>.
  ASSIGN COMPONENT 2 OF STRUCTURE <fs_replace> TO <fs_to>.
  CALL METHOD OF l_cells 'Replace'
    EXPORTING
      #1 = <fs_from>
      #2 = <fs_to>.
ENDLOOP.
SET PROPERTY OF l_app 'Visible' = 1.

```

</details>
