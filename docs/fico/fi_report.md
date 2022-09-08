# 通用取值模块

财务三大报表取值部分可以通用，因此下面只对取值部分进行封装，通过传入配置，可以获取各项目的年初、年末、各期间金额。

## 入参结构

| 字段 | 说明 |
|-|-|
| BUKRS | 公司代码 |
| ZITEM | 项目 |
| ZITEM_SUB | 子项目 |
| ZTEXT | 项目描述 |
| REVERSE | 反向标识，计算或汇总时使用 |
| T_ACCAT_OPT | 科目Range表 |
| T_FILTER | 除科目外的其他Range表，按字段名动态过滤 |
| T_COLLECT | ZITEM项目子表，汇总其他项目结果 |

### 示例入参

假如现在需要:

1. 项目\[资产总值\]，ZITEM=1，汇总:

    1. 科目1100\*

    2. 功能范围100、200

    3. ZITEM=2、3

    4. 科目2\*且利润中心21\*

2. 项目\[流动资产\]，ZITEM=2，汇总科目3\*、4\*、5\*

3. 项目\[非流动资产\]，ZITEM=3，汇总科目6\*、7\*、8\*

可以得出入参：

| BUKRS | ZITEM | ZITEM_SUB | ZTEXT | REVERSE | T_ACCAT_OPT | T_FILTER | T_COLLECT |
|-|-|-|-|-|-|-|-|
| 1000 | 1 | 1 | 资产总值 |  |  |  |  |
| 1000 | 1 | 2 | 科目项 | | 1100* |  |  |
| 1000 | 1 | 3 | 过滤项 | | | 功能范围=100/200 |  |
| 1000 | 1 | 4 | 其他项 | | | | ZITEM=2/3 |
| 1000 | 1 | 5 | 结合使用 | | 2* | 利润中心=21* | | |
|||||||||
| 1000 | 2 | 1 | 流动资产 | | |  |  |
| 1000 | 2 | 2 | | | 3* |  |  |
| 1000 | 2 | 3 | | | 4* |  |  |
| 1000 | 2 | 4 | | | 5* |  |  |
|||||||||
| 1000 | 3 | 1 | 非流动资产 | | |  |  |
| 1000 | 3 | 2 | | | 6* |  |  |
| 1000 | 3 | 3 | | | 7* |  |  |
| 1000 | 3 | 4 | | | 8* |  |  |
|||||||||

## 出参结构

出参结构包括了年初、年末、本月、截止本月累计、其他各月数据，按需使用即可：

| 字段 | 说明 |
|-|-|
| BUKRS | 公司代码 |
| YEAR | 年度 |
| PERIOD | 期间 |
| ZITEM | 项目 |
| ZTEXT | 项目描述 |
| YEAR_BEGIN | 年初余额 |
| TEAR_END | 年末余额 |
| PERIOD_CURRENT | 本月金额 |
| PERIOD_TOTAL | 截止本月累计金额 |
| PERIOD_01 | 01月余额 |
| PERIOD_02 | 02月余额 |
| PERIOD_03 | 03月余额 |
| PERIOD_04 | 04月余额 |
| PERIOD_05 | 05月余额 |
| PERIOD_06 | 06月余额 |
| PERIOD_07 | 07月余额 |
| PERIOD_08 | 08月余额 |
| PERIOD_09 | 09月余额 |
| PERIOD_10 | 10月余额 |
| PERIOD_11 | 11月余额 |
| PERIOD_12 | 12月余额 |
| PERIOD_13 | 13月余额 |
| PERIOD_14 | 14月余额 |
| PERIOD_15 | 15月余额 |
| PERIOD_16 | 16月余额 |

## 文件导出

三大报表格式固定，因此可以通过文本替换的方式，将模板中的占位符替换为其他值。

### XLSX格式导出

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

### XLS格式导出

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

## Include文件

<details>
  <summary>示例代码</summary>

```ABAP

*&---------------------------------------------------------------------*
*& Include zfi_report
*&---------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*& 三大报表取值部分可以通用，因此抽取出来形成一个模块
*&---------------------------------------------------------------------*
" 财务明细数据键值
TYPES:
  BEGIN OF ty_detail_key,
    rldnr  TYPE acdoca-rldnr,
    rbukrs TYPE acdoca-rbukrs,
    gjahr  TYPE acdoca-gjahr,
    belnr  TYPE acdoca-belnr,
    docln  TYPE acdoca-docln,
  END OF ty_detail_key.
TYPES tt_detail_key TYPE STANDARD TABLE OF ty_detail_key WITH EMPTY KEY.

" 财务明细数据
TYPES:
  BEGIN OF ty_detail,
    rldnr  TYPE acdoca-rldnr,
    rbukrs TYPE acdoca-rbukrs,
    gjahr  TYPE acdoca-gjahr,
    belnr  TYPE acdoca-belnr,
    docln  TYPE acdoca-docln,
    ryear  TYPE acdoca-ryear, " 财年
    poper  TYPE acdoca-poper, " 期间
    racct  TYPE acdoca-racct, " 会计科目
    rcntr  TYPE acdoca-rcntr, " 成本中心
    prctr  TYPE acdoca-prctr, " 利润中心
    rstgr  TYPE acdoca-rstgr, " RSTGR
    rfarea TYPE acdoca-rfarea, " 功能范围
    rbusa  TYPE acdoca-rbusa, " 业务范围
    budat  TYPE acdoca-budat, " 过账日期
    shkzg  TYPE shkzg, " 借贷
    hsl    TYPE acdoca-hsl,
  END OF ty_detail.
TYPES tt_detail TYPE STANDARD TABLE OF ty_detail WITH EMPTY KEY.

" 报表数据
TYPES ty_amount TYPE p LENGTH 16 DECIMALS 2. " 金额
TYPES:
  BEGIN OF ty_fi_data,
    bukrs          TYPE bukrs, " 公司
    year           TYPE gjahr, " 年度
    period         TYPE monat, " 期间
    zitem          TYPE string, " 项目
    ztext          TYPE string, " 项目描述
    year_begin     TYPE ty_amount, " 年初余额
    year_end       TYPE ty_amount, " 年末余额
    period_current TYPE ty_amount, " 本月金额
    period_total   TYPE ty_amount, " 截止本月累计金额
    period_01      TYPE ty_amount, " 01月余额
    period_02      TYPE ty_amount, " 02月余额
    period_03      TYPE ty_amount, " 03月余额
    period_04      TYPE ty_amount, " 04月余额
    period_05      TYPE ty_amount, " 05月余额
    period_06      TYPE ty_amount, " 06月余额
    period_07      TYPE ty_amount, " 07月余额
    period_08      TYPE ty_amount, " 08月余额
    period_09      TYPE ty_amount, " 09月余额
    period_10      TYPE ty_amount, " 10月余额
    period_11      TYPE ty_amount, " 11月余额
    period_12      TYPE ty_amount, " 12月余额
    period_13      TYPE ty_amount, " 13月余额
    period_14      TYPE ty_amount, " 14月余额
    period_15      TYPE ty_amount, " 15月余额
    period_16      TYPE ty_amount, " 16月余额
    t_detail_key   TYPE tt_detail_key, " 明细数据键值
  END OF ty_fi_data.
TYPES tt_fi_data TYPE STANDARD TABLE OF ty_fi_data WITH EMPTY KEY.

" 筛选项
TYPES:
  BEGIN OF ty_filter,
    name        TYPE string,
    t_range_opt TYPE RANGE OF char40,
  END OF ty_filter.

" 配置数据
TYPES ty_config_key TYPE n LENGTH 3.
TYPES:
  BEGIN OF ty_config,
    bukrs            TYPE bukrs, " 公司
    zitem            TYPE ty_config_key, " 项目
    zitem_sub        TYPE ty_config_key, " 子项目
    ztext            TYPE string, " 描述
    reverse          TYPE xfeld, " 反向标记，汇总或计算的时候使用
    fi_data          TYPE ty_fi_data,
    t_racct_opt      TYPE RANGE OF racct, " 科目作为财务数据首要筛选维度
    t_filter         TYPE STANDARD TABLE OF ty_filter WITH EMPTY KEY, " 筛选项
    t_collect        TYPE STANDARD TABLE OF ty_config_key WITH EMPTY KEY, " 引用汇总其他项目结果
    processed        TYPE char01, " 处理标识，未处理[空]，处理中[P]，已处理[X]，用于死循环检查和跳过冗余计算
    callback_program TYPE programm, " 对于特殊配置，通过回调方法进行处理
    callback_from    TYPE char30, " 对于特殊配置，通过回调方法进行处理
  END OF ty_config.
TYPES tt_config TYPE STANDARD TABLE OF ty_config WITH EMPTY KEY.

*&---------------------------------------------------------------------*
*& 财务报表操作对象
*&---------------------------------------------------------------------*
CLASS lcl_fi_report DEFINITION DEFERRED.

*&---------------------------------------------------------------------*
*& 财务报表操作对象
*&---------------------------------------------------------------------*
CLASS lcl_fi_report DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS get_smw0_templete IMPORTING i_objid         TYPE w3objid
                                    RETURNING VALUE(r_buffer) TYPE xstring .
    CLASS-METHODS replace_texts IMPORTING it_replace TYPE ANY TABLE
                                CHANGING  c_doc      TYPE xstring.
    CLASS-METHODS create IMPORTING i_year           TYPE gjahr
                                   i_period         TYPE monat
                                   it_config        TYPE tt_config
                         RETURNING VALUE(ro_result) TYPE REF TO lcl_fi_report.
    METHODS execute RETURNING VALUE(rt_fi_data) TYPE tt_fi_data.
  PRIVATE SECTION.
    METHODS get_detail.
    METHODS get_fi_data IMPORTING ir_config TYPE REF TO ty_config
                                  i_depth   TYPE i OPTIONAL.
    DATA m_year TYPE gjahr.
    DATA m_period TYPE monat.
    DATA mt_config TYPE tt_config.
    DATA mt_detail TYPE tt_detail.
ENDCLASS.

*&---------------------------------------------------------------------*
*& 财务报表操作对象
*&---------------------------------------------------------------------*
CLASS lcl_fi_report IMPLEMENTATION.

*&---------------------------------------------------------------------*
*& 财务报表操作对象
*&---------------------------------------------------------------------*
  METHOD create.

    ro_result = NEW #( ).
    ro_result->mt_config = it_config.
    ro_result->m_year = i_year.
    ro_result->m_period = i_period.

  ENDMETHOD.

*&---------------------------------------------------------------------*
*& 根据配置执行
*&---------------------------------------------------------------------*
  METHOD execute.

    SORT mt_config BY bukrs zitem zitem_sub.

    get_detail( ). " 获取报表明细数据
    LOOP AT mt_config REFERENCE INTO DATA(lr_config).
      get_fi_data( lr_config ). " 生成报表行数据
    ENDLOOP.

    LOOP AT mt_config REFERENCE INTO lr_config
      GROUP BY (
        bukrs = lr_config->bukrs
        zitem = lr_config->zitem
      ) INTO DATA(ls_config_grp).

      DATA ls_fi_data TYPE ty_fi_data.
      CLEAR ls_fi_data.
      ls_fi_data-bukrs = ls_config_grp-bukrs.
      ls_fi_data-year = m_year.
      ls_fi_data-period = m_period.
      ls_fi_data-zitem = ls_config_grp-zitem.

      LOOP AT GROUP ls_config_grp REFERENCE INTO lr_config. " 文本任取一行有值的
        IF lr_config->ztext IS NOT INITIAL.
          ls_fi_data-ztext = lr_config->ztext.
          EXIT.
        ENDIF.
      ENDLOOP.

      LOOP AT GROUP ls_config_grp REFERENCE INTO lr_config.
        ls_fi_data-year_begin = ls_fi_data-year_begi + lr_config->fi_data-year_begin. " 年初余额
        ls_fi_data-period_01  = ls_fi_data-period_01 + lr_config->fi_data-period_01 . " 01月余额
        ls_fi_data-period_02  = ls_fi_data-period_02 + lr_config->fi_data-period_02 . " 02月余额
        ls_fi_data-period_03  = ls_fi_data-period_03 + lr_config->fi_data-period_03 . " 03月余额
        ls_fi_data-period_04  = ls_fi_data-period_04 + lr_config->fi_data-period_04 . " 04月余额
        ls_fi_data-period_05  = ls_fi_data-period_05 + lr_config->fi_data-period_05 . " 05月余额
        ls_fi_data-period_06  = ls_fi_data-period_06 + lr_config->fi_data-period_06 . " 06月余额
        ls_fi_data-period_07  = ls_fi_data-period_07 + lr_config->fi_data-period_07 . " 07月余额
        ls_fi_data-period_08  = ls_fi_data-period_08 + lr_config->fi_data-period_08 . " 08月余额
        ls_fi_data-period_09  = ls_fi_data-period_09 + lr_config->fi_data-period_09 . " 09月余额
        ls_fi_data-period_10  = ls_fi_data-period_10 + lr_config->fi_data-period_10 . " 10月余额
        ls_fi_data-period_11  = ls_fi_data-period_11 + lr_config->fi_data-period_11 . " 11月余额
        ls_fi_data-period_12  = ls_fi_data-period_12 + lr_config->fi_data-period_12 . " 12月余额
        ls_fi_data-period_13  = ls_fi_data-period_13 + lr_config->fi_data-period_13 . " 13月余额
        ls_fi_data-period_14  = ls_fi_data-period_14 + lr_config->fi_data-period_14 . " 14月余额
        ls_fi_data-period_15  = ls_fi_data-period_15 + lr_config->fi_data-period_15 . " 15月余额
        ls_fi_data-period_16  = ls_fi_data-period_16 + lr_config->fi_data-period_16 . " 16月余额
        INSERT LINES OF lr_config->fi_data-t_detail_key INTO TABLE ls_fi_data-t_detail_key. " 明细数据键值
      ENDLOOP.

      ls_fi_data-year_end = ls_fi_data-year_begin.
      DO 16 TIMES.
        DATA l_period TYPE ty_fi_data-period.
        l_period = sy-index.
        ASSIGN COMPONENT |PERIOD_{ sy-index ALIGN = RIGHT WIDTH = 2 PAD = '0' }| OF STRUCTURE ls_fi_data TO FIELD-SYMBOL(<fs_period>).
        IF <fs_period> IS ASSIGNED.
          ls_fi_data-year_end = ls_fi_data-year_end + <fs_period>. " 年末余额
          IF ls_fi_data-period >= l_period. " 截止本月末累计金额
            ls_fi_data-period_total = ls_fi_data-period_total + <fs_period>.
          ENDIF.
          IF ls_fi_data-period = l_period. " 本月金额
            ls_fi_data-period_current = <fs_period>.
          ENDIF.
        ENDIF.
      ENDDO.

      INSERT ls_fi_data INTO TABLE rt_fi_data.
    ENDLOOP.

  ENDMETHOD.

*&---------------------------------------------------------------------*
*& 获取财务明细数据
*&---------------------------------------------------------------------*
  METHOD get_detail.

    LOOP AT mt_config REFERENCE INTO DATA(lr_config)
      GROUP BY ( bukrs = lr_config->bukrs ) INTO DATA(ls_config_grp).

      " 科目范围
      DATA lt_racct_opt TYPE RANGE OF racct.
      CLEAR lt_racct_opt.
      LOOP AT GROUP ls_config_grp REFERENCE INTO lr_config.
        INSERT LINES OF lr_config->t_racct_opt INTO TABLE lt_racct_opt.
      ENDLOOP.
      CHECK lt_racct_opt IS NOT INITIAL.

      SORT lt_racct_opt.
      DELETE ADJACENT DUPLICATES FROM lt_racct_opt COMPARING ALL FIELDS.

      " TODO 超过大约一万行数据就应该分批处理了

      " 预查询出全部相关的财务数据
      SELECT
        rldnr,
        rbukrs,
        gjahr,
        belnr,
        docln,
        ryear, " 财年
        poper, " 期间
        racct, " 会计科目
        rcntr, " 成本中心
        prctr, " 利润中心
        rstgr, " 原因代码
        rfarea, " 功能范围
        rbusa, " 业务范围
        budat,
        CASE WHEN hsl > 0 THEN 'S' ELSE 'H' END AS shkzg, " 借贷标识
        hsl
        FROM acdoca
        WHERE rldnr = '0L' " 主账目表，应该不会变吧？
          AND rbukrs = @ls_config_grp-bukrs
          AND ryear = @m_year
          AND racct IN @lt_racct_opt
        APPENDING TABLE @mt_detail.
    ENDLOOP.

    SORT mt_detail BY rldnr rbukrs gjahr belnr docln.

  ENDMETHOD.

*&---------------------------------------------------------------------*
*& 生成报表行数据
*&---------------------------------------------------------------------*
  METHOD get_fi_data.

    IF i_depth > 10 " 迭代层级，防止栈溢出
    OR ir_config IS NOT BOUND " 空值检查
    OR ir_config->processed IS NOT INITIAL " 处理标记检查，防止死循环，以及跳过冗余计算
    .
      RETURN.
    ENDIF.

    ir_config->processed = 'P'. " 处理中

    " 对于文本项，并不需要筛选
    IF ir_config->t_racct_opt IS NOT INITIAL
    OR ir_config->t_filter IS NOT INITIAL.
      " 获取当前配置行的有效数据
      SELECT * FROM @mt_detail AS ds
        WHERE rbukrs = @ir_config->bukrs
          AND racct IN @ir_config->t_racct_opt " 科目
        INTO TABLE @DATA(lt_detail).

      " 除科目外，其他筛选项动态处理
      LOOP AT ir_config->t_filter INTO DATA(ls_filter) WHERE t_range_opt IS NOT INITIAL.
        IF lt_detail IS NOT INITIAL.
          DATA(l_condition) = |{ ls_filter-name } IN @LS_FILTER-T_RANGE_OPT|.
          TRY.
              SELECT * FROM @lt_detail AS ds WHERE (l_condition) INTO TABLE @lt_detail.
            CATCH cx_root.
          ENDTRY.
        ENDIF.
      ENDLOOP.
    ENDIF.

    " 特殊处理
    IF ir_config->callback_program IS NOT INITIAL
    AND ir_config->callback_from IS NOT INITIAL.
      PERFORM (ir_config->callback_from) IN PROGRAM (ir_config->callback_program) IF FOUND TABLES lt_detail.
    ENDIF.

    " 汇总财务数据
    LOOP AT lt_detail INTO DATA(ls_detail).
      CASE ls_detail-poper.
        WHEN  0. ir_config->fi_data-year_begin = ir_config->fi_data-year_begin + ls_detail-hsl.
        WHEN  1. ir_config->fi_data-period_01 = ir_config->fi_data-period_01 + ls_detail-hsl.
        WHEN  2. ir_config->fi_data-period_02 = ir_config->fi_data-period_02 + ls_detail-hsl.
        WHEN  3. ir_config->fi_data-period_03 = ir_config->fi_data-period_03 + ls_detail-hsl.
        WHEN  4. ir_config->fi_data-period_04 = ir_config->fi_data-period_04 + ls_detail-hsl.
        WHEN  5. ir_config->fi_data-period_05 = ir_config->fi_data-period_05 + ls_detail-hsl.
        WHEN  6. ir_config->fi_data-period_06 = ir_config->fi_data-period_06 + ls_detail-hsl.
        WHEN  7. ir_config->fi_data-period_07 = ir_config->fi_data-period_07 + ls_detail-hsl.
        WHEN  8. ir_config->fi_data-period_08 = ir_config->fi_data-period_08 + ls_detail-hsl.
        WHEN  9. ir_config->fi_data-period_09 = ir_config->fi_data-period_09 + ls_detail-hsl.
        WHEN 10. ir_config->fi_data-period_10 = ir_config->fi_data-period_10 + ls_detail-hsl.
        WHEN 11. ir_config->fi_data-period_11 = ir_config->fi_data-period_11 + ls_detail-hsl.
        WHEN 12. ir_config->fi_data-period_12 = ir_config->fi_data-period_12 + ls_detail-hsl.
        WHEN 13. ir_config->fi_data-period_13 = ir_config->fi_data-period_13 + ls_detail-hsl.
        WHEN 14. ir_config->fi_data-period_14 = ir_config->fi_data-period_14 + ls_detail-hsl.
        WHEN 15. ir_config->fi_data-period_15 = ir_config->fi_data-period_15 + ls_detail-hsl.
        WHEN 16. ir_config->fi_data-period_16 = ir_config->fi_data-period_16 + ls_detail-hsl.
        WHEN OTHERS.
      ENDCASE.

      " 写入到明细清单中
      READ TABLE mt_detail TRANSPORTING NO FIELDS WITH KEY
      rldnr = ls_detail-rldnr
      rbukrs = ls_detail-rbukrs
      gjahr = ls_detail-gjahr
      belnr = ls_detail-belnr
      docln = ls_detail-docln
      BINARY SEARCH.
      IF sy-subrc = 0.
        INSERT CORRESPONDING #( ls_detail ) INTO TABLE ir_config->fi_data-t_detail_key.
      ENDIF.
    ENDLOOP.

    " 汇总其他项的财务数据
    LOOP AT ir_config->t_collect INTO DATA(l_other_zitem).
      READ TABLE mt_config TRANSPORTING NO FIELDS WITH KEY " 嵌套循环优化
      bukrs = ir_config->bukrs
      zitem = l_other_zitem
      BINARY SEARCH.
        IF sy-subrc = 0.
          LOOP AT mt_config REFERENCE INTO DATA(lr_config) FROM sy-tabix.
            IF lr_config->bukrs <> ir_config->bukrs
            OR lr_config->zitem <> l_other_zitem.
              EXIT.
            ENDIF.

            " 递归取值
            get_fi_data( ir_config = lr_config i_depth = i_depth + 1 ). " 递归取值

            ir_config->fi_data-year_begin = ir_config->fi_data-year_begin + lr_config->fi_data-year_begin * l_factor. " 年初余额
            ir_config->fi_data-period_01 = ir_config->fi_data-period_01 + lr_config->fi_data-period_01 * l_factor. " 01月余额
            ir_config->fi_data-period_02 = ir_config->fi_data-period_02 + lr_config->fi_data-period_02 * l_factor. " 02月余额
            ir_config->fi_data-period_03 = ir_config->fi_data-period_03 + lr_config->fi_data-period_03 * l_factor. " 03月余额
            ir_config->fi_data-period_04 = ir_config->fi_data-period_04 + lr_config->fi_data-period_04 * l_factor. " 04月余额
            ir_config->fi_data-period_05 = ir_config->fi_data-period_05 + lr_config->fi_data-period_05 * l_factor. " 05月余额
            ir_config->fi_data-period_06 = ir_config->fi_data-period_06 + lr_config->fi_data-period_06 * l_factor. " 06月余额
            ir_config->fi_data-period_07 = ir_config->fi_data-period_07 + lr_config->fi_data-period_07 * l_factor. " 07月余额
            ir_config->fi_data-period_08 = ir_config->fi_data-period_08 + lr_config->fi_data-period_08 * l_factor. " 08月余额
            ir_config->fi_data-period_09 = ir_config->fi_data-period_09 + lr_config->fi_data-period_09 * l_factor. " 09月余额
            ir_config->fi_data-period_10 = ir_config->fi_data-period_10 + lr_config->fi_data-period_10 * l_factor. " 10月余额
            ir_config->fi_data-period_11 = ir_config->fi_data-period_11 + lr_config->fi_data-period_11 * l_factor. " 11月余额
            ir_config->fi_data-period_12 = ir_config->fi_data-period_12 + lr_config->fi_data-period_12 * l_factor. " 12月余额
            ir_config->fi_data-period_13 = ir_config->fi_data-period_13 + lr_config->fi_data-period_13 * l_factor. " 13月余额
            ir_config->fi_data-period_14 = ir_config->fi_data-period_14 + lr_config->fi_data-period_14 * l_factor. " 14月余额
            ir_config->fi_data-period_15 = ir_config->fi_data-period_15 + lr_config->fi_data-period_15 * l_factor. " 15月余额
            ir_config->fi_data-period_16 = ir_config->fi_data-period_16 + lr_config->fi_data-period_16 * l_factor. " 16月余额
            INSERT LINES OF lr_config->fi_data-t_detail_key INTO TABLE ir_config->fi_data-t_detail_key. " 明细数据
          ENDLOOP.
        ENDIF.
    ENDLOOP.

    " 反向标记
    IF ir_config->reverse IS NOT INITIAL.
      ir_config->fi_data-year_begin *= -1. " 年初余额
      ir_config->fi_data-period_01  *= -1. " 01月余额
      ir_config->fi_data-period_02  *= -1. " 02月余额
      ir_config->fi_data-period_03  *= -1. " 03月余额
      ir_config->fi_data-period_04  *= -1. " 04月余额
      ir_config->fi_data-period_05  *= -1. " 05月余额
      ir_config->fi_data-period_06  *= -1. " 06月余额
      ir_config->fi_data-period_07  *= -1. " 07月余额
      ir_config->fi_data-period_08  *= -1. " 08月余额
      ir_config->fi_data-period_09  *= -1. " 09月余额
      ir_config->fi_data-period_10  *= -1. " 10月余额
      ir_config->fi_data-period_11  *= -1. " 11月余额
      ir_config->fi_data-period_12  *= -1. " 12月余额
      ir_config->fi_data-period_13  *= -1. " 13月余额
      ir_config->fi_data-period_14  *= -1. " 14月余额
      ir_config->fi_data-period_15  *= -1. " 15月余额
      ir_config->fi_data-period_16  *= -1. " 16月余额
    ENDIF.

    ir_config->processed = 'X'. " 处理完成

  ENDMETHOD.

*&---------------------------------------------------------------------*
*& 从SMW0获取模板文件
*&---------------------------------------------------------------------*
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

*&---------------------------------------------------------------------*
*& 替换模板文件中的文本内容
*&---------------------------------------------------------------------*
  METHOD replace_texts.

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
