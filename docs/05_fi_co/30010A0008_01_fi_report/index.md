# 报表查询工具

财务报表多按配置进行动态处理，用于对应项目不同的财务报表需求。

因此封装取值工具，通过设置报表模板，并传入参数（公司代码等）即可生成需求报表。

## 报表模板

| 字段 | 说明 |
| - | - |
| ZINDEX | 排序用 |
| ZITEM | 项目 |
| ZTEXT | 项目描述 |
| INVERSE | 负号 |
| T_ACCAT_OPT | 科目范围 |
| T_FILTER | 除科目范围外，其他筛选项 |
| T_CHILD | 子项，汇总其他项目结果 |
| T_DETAIL | 明细数据，可以用在穿透需求 |
| T_CUSTOMIZE | 特殊取值 |

### 示例模板

| ZITEM | ZTEXT | INVERSE | T_ACCAT_OPT | T_FILTER | T_CHILD |
| - | - | - | - | - | - |
| 1 | 项目1 | | | | |
| 1 | | | 1100* | | |
| 1 | | | | 功能范围=100,200 | |
| 1 | | | | | ZITEM=2,3 |
| 1 | | | 1900* | 利润中心=21* | |
| 2 | 项目2 | | 2* | | |
| 3 | 项目3 | X | 3* | | |

## 报表结果

| 字段 | 说明 |
| - | - |
| ZITEM | 项目 |
| ZTEXT | 项目描述 |
| FI | 财务数据，包括各月份季度的余额和发生额，按需取值即可 |
| FI_LOC | 本币财务数据 |

## 工具类

<details>
  <summary>ZCL_FI_REPORT</summary>

```ABAP

CLASS zcl_fi_report DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC .

  PUBLIC SECTION.

    TYPES:
      ty_amount TYPE p LENGTH 16 DECIMALS 2 .
    TYPES:
      BEGIN OF ty_fi_data,
        current_period     TYPE ty_amount, " 当前期间发生额
        current_period_end TYPE ty_amount, " 当前期间余额
        year_begin         TYPE ty_amount, " 年初余额
        year_end           TYPE ty_amount, " 年终余额
        m01                TYPE ty_amount, " 1月发生额
        m02                TYPE ty_amount, " 2月发生额
        m03                TYPE ty_amount, " 3月发生额
        m04                TYPE ty_amount, " 4月发生额
        m05                TYPE ty_amount, " 5月发生额
        m06                TYPE ty_amount, " 6月发生额
        m07                TYPE ty_amount, " 7月发生额
        m08                TYPE ty_amount, " 8月发生额
        m09                TYPE ty_amount, " 9月发生额
        m10                TYPE ty_amount, " 10月发生额
        m11                TYPE ty_amount, " 11月发生额
        m12                TYPE ty_amount, " 12月发生额
        m13                TYPE ty_amount, " 13月发生额
        m14                TYPE ty_amount, " 14月发生额
        m15                TYPE ty_amount, " 15月发生额
        m16                TYPE ty_amount, " 16月发生额
        q1                 TYPE ty_amount, " 1季度发生额
        q2                 TYPE ty_amount, " 2季度发生额
        q3                 TYPE ty_amount, " 3季度发生额
        q4                 TYPE ty_amount, " 4季度发生额
        m01end             TYPE ty_amount, " 1月余额
        m02end             TYPE ty_amount, " 2月余额
        m03end             TYPE ty_amount, " 3月余额
        m04end             TYPE ty_amount, " 4月余额
        m05end             TYPE ty_amount, " 5月余额
        m06end             TYPE ty_amount, " 6月余额
        m07end             TYPE ty_amount, " 7月余额
        m08end             TYPE ty_amount, " 8月余额
        m09end             TYPE ty_amount, " 9月余额
        m10end             TYPE ty_amount, " 10月余额
        m11end             TYPE ty_amount, " 11月余额
        m12end             TYPE ty_amount, " 12月余额
        m13end             TYPE ty_amount, " 13月余额
        m14end             TYPE ty_amount, " 14月余额
        m15end             TYPE ty_amount, " 15月余额
        m16end             TYPE ty_amount, " 16月余额
        q1end              TYPE ty_amount, " 1季度余额
        q2end              TYPE ty_amount, " 2季度余额
        q3end              TYPE ty_amount, " 3季度余额
        q4end              TYPE ty_amount, " 4季度余额
      END OF ty_fi_data .
    TYPES:
      ty_zitem TYPE c LENGTH 20 .                " 报表项目
    TYPES:
      BEGIN OF ty_detail_key,
        rldnr  TYPE acdoca-rldnr,
        rbukrs TYPE acdoca-rbukrs,
        gjahr  TYPE acdoca-gjahr,
        belnr  TYPE acdoca-belnr,
        docln  TYPE acdoca-docln,
      END OF ty_detail_key .
    TYPES:
      ty_detail_key_t TYPE STANDARD TABLE OF ty_detail_key WITH EMPTY KEY.
    TYPES:
      BEGIN OF ty_filter,
        name         TYPE char30,
        t_select_opt TYPE RANGE OF char50, " 50位长足够应付大部分情况了
      END OF ty_filter .
    TYPES:
      ty_filter_t TYPE STANDARD TABLE OF ty_filter WITH EMPTY KEY.
    TYPES:
      BEGIN OF ty_child,
        zitem TYPE ty_zitem,
        zsign TYPE c LENGTH 1, " 运算符号
      END OF ty_child .
    TYPES:
      ty_child_t TYPE STANDARD TABLE OF ty_child WITH EMPTY KEY.
    TYPES:
      BEGIN OF ty_customize,
        function   TYPE char30, " 回调函数
        class      TYPE char30, " 回调类名
        method     TYPE char61, " 回调静态方法名
        progrom    TYPE char40, " 回调程序名
        subroutine TYPE char30, " 回调子例程
      END OF ty_customize .
    TYPES:
      ty_customize_t TYPE STANDARD TABLE OF ty_customize WITH EMPTY KEY.
    TYPES:
      BEGIN OF ty_report,
        zindex      TYPE sy-index, " 用于排序
        zitem       TYPE ty_zitem, " 报表项目
        ztext       TYPE c LENGTH 40, " 报表项目描述
        inverse     TYPE c LENGTH 1, " 反向标识
        processed   TYPE c LENGTH 1, " 处理标识，未处理[空]，处理中[P]，已处理[X]，用于死循环检查和跳过冗余计算
        fi          TYPE ty_fi_data, " 财务数据
        fi_ksl      TYPE ty_fi_data, " 外币财务数据
        t_racct_opt TYPE RANGE OF racct, " 科目范围
        t_filter    TYPE ty_filter_t, " 其他动态筛选项
        t_child     TYPE ty_child_t, " 汇总其他项目数据
        t_customize TYPE ty_customize_t, " 特殊处理方法
        t_detail    TYPE ty_detail_key_t, " 凭证行清单
      END OF ty_report .
    TYPES:
      ty_report_t TYPE STANDARD TABLE OF ty_report WITH EMPTY KEY.
    TYPES ty_acdoca TYPE acdoca .
    TYPES ty_faglflext TYPE v_faglflext_view .
    TYPES:
      ty_acdoca_t TYPE STANDARD TABLE OF ty_acdoca .
    TYPES:
      ty_faglflext_t TYPE STANDARD TABLE OF ty_faglflext WITH EMPTY KEY .

    " 目前仅支持加减计算，如有需要，可自己扩展
    CONSTANTS:
      BEGIN OF cns_sign,
        plus  VALUE '+',
        minus VALUE '-',
      END OF cns_sign .
    CONSTANTS:
      BEGIN OF cns_datatab,
        acdoca    TYPE tabname VALUE 'ACDOCA',
        faglflext TYPE tabname VALUE 'FAGLFLEXT',
      END OF cns_datatab .
    CLASS-DATA m_datatab TYPE tabname .
    DATA m_rldnr TYPE acdoca-rldnr .
    DATA m_rbukrs TYPE acdoca-rbukrs .
    DATA m_ryear TYPE acdoca-ryear .
    DATA mt_filter TYPE ty_filter_t .
    DATA mt_report TYPE ty_report_t .
    DATA mt_acdoca TYPE ty_acdoca_t .
    DATA mt_faglflext TYPE ty_faglflext_t .

    CLASS-METHODS class_constructor .
    CLASS-METHODS execute
      IMPORTING
        !i_rldnr  TYPE rldnr DEFAULT '0L'
        !i_rbukrs TYPE bukrs OPTIONAL
        !i_ryear  TYPE ryear DEFAULT sy-datum(4)
        !i_filter TYPE ty_filter_t OPTIONAL
      CHANGING
        !c_report TYPE ty_report_t .
    CLASS-METHODS from_table
      IMPORTING
        !i_tabname TYPE tabname .
    CLASS-METHODS cus_clear_data
      IMPORTING
        !i_report_line TYPE REF TO ty_report
      CHANGING
        !c_acdoca      TYPE ty_acdoca_t
        !c_faglflext   TYPE ty_faglflext_t .
  PROTECTED SECTION.
  PRIVATE SECTION.

    METHODS _get_data .
    METHODS _set_global_filter .
    METHODS _set_report_line
      IMPORTING
        !i_report_line TYPE REF TO ty_report
        !i_depth       TYPE i OPTIONAL .
    METHODS _add_fi_acdoca
      IMPORTING
        !i_report_line TYPE REF TO ty_report
        !i_acdoca      TYPE REF TO acdoca .
    METHODS _add_fi_faglflext
      IMPORTING
        !i_report_line TYPE REF TO ty_report
        !i_faglflext   TYPE REF TO v_faglflext_view .
    METHODS _add_fi_report_line
      IMPORTING
        !i_report_line TYPE REF TO ty_report
        !i_other_line  TYPE REF TO ty_report .
    METHODS _inverse_fi
      IMPORTING
        !i_report_line TYPE REF TO ty_report .
    METHODS _calc_fi
      IMPORTING
        !i_report_line TYPE REF TO ty_report .
ENDCLASS.



CLASS zcl_fi_report IMPLEMENTATION.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method zcl_fi_report=>CLASS_CONSTRUCTOR
* +-------------------------------------------------------------------------------------------------+
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD class_constructor.

    " 默认从FAGLGLEXT表取值
    " ACDOCA有更细的粒度，因此性能会更慢，如果没有明细需求，不建议使用
    m_datatab = cns_datatab-faglflext.

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method zcl_fi_report=>CUS_CLEAR_DATA
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_REPORT_LINE                  TYPE REF TO ty_REPORT
* | [<-->] C_ACDOCA                       TYPE        ty_ACDOCA_T
* | [<-->] C_FAGLFLEXT                    TYPE        ty_FAGLFLEXT_T
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD cus_clear_data.

    " 对于汇总行，一般不从表取值
    CLEAR i_report_line->fi.
    CLEAR i_report_line->fi_ksl.
    CLEAR i_report_line->t_detail.
    CLEAR c_acdoca.
    CLEAR c_faglflext.

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method zcl_fi_report=>EXECUTE
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_RLDNR                        TYPE        RLDNR (default ='0L')
* | [--->] I_RBUKRS                       TYPE        BUKRS(optional)
* | [--->] I_RYEAR                        TYPE        RYEAR (default =SY-DATUM(4))
* | [--->] I_FILTER                       TYPE        ty_FILTER_T(optional)
* | [<-->] C_REPORT                       TYPE        ty_REPORT_T
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD execute.

    DATA(lo_report) = NEW zcl_fi_report( ).
    lo_report->m_rldnr = i_rldnr.
    lo_report->m_rbukrs = i_rbukrs.
    lo_report->m_ryear = i_ryear.
    lo_report->mt_filter = i_filter.
    lo_report->mt_report = c_report.

    lo_report->_get_data( ).
    lo_report->_set_global_filter( ).
    LOOP AT lo_report->mt_report REFERENCE INTO DATA(lr_report).
      lo_report->_set_report_line( i_report_line = lr_report ).
    ENDLOOP.

    c_report = lo_report->mt_report.

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method zcl_fi_report=>FROM_TABLE
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_TABNAME                      TYPE        TABNAME
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD from_table.

    m_datatab = i_tabname.

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method zcl_fi_report->_ADD_FI_ACDOCA
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_REPORT_LINE                  TYPE REF TO ty_REPORT
* | [--->] I_ACDOCA                       TYPE REF TO ACDOCA
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD _add_fi_acdoca.

    IF i_report_line IS NOT BOUND OR i_acdoca IS NOT BOUND.
      RETURN.
    ENDIF.

    " 汇总数据
    CASE i_acdoca->poper.
      WHEN  0. i_report_line->fi-year_begin = i_report_line->fi-year_begin + i_acdoca->hsl.
      WHEN  1. i_report_line->fi-m01 = i_report_line->fi-m01 + i_acdoca->hsl. "
      WHEN  2. i_report_line->fi-m02 = i_report_line->fi-m02 + i_acdoca->hsl. "
      WHEN  3. i_report_line->fi-m03 = i_report_line->fi-m03 + i_acdoca->hsl. "
      WHEN  4. i_report_line->fi-m04 = i_report_line->fi-m04 + i_acdoca->hsl. "
      WHEN  5. i_report_line->fi-m05 = i_report_line->fi-m05 + i_acdoca->hsl. "
      WHEN  6. i_report_line->fi-m06 = i_report_line->fi-m06 + i_acdoca->hsl. "
      WHEN  7. i_report_line->fi-m07 = i_report_line->fi-m07 + i_acdoca->hsl. "
      WHEN  8. i_report_line->fi-m08 = i_report_line->fi-m08 + i_acdoca->hsl. "
      WHEN  9. i_report_line->fi-m09 = i_report_line->fi-m09 + i_acdoca->hsl. "
      WHEN 10. i_report_line->fi-m10 = i_report_line->fi-m10 + i_acdoca->hsl. "
      WHEN 11. i_report_line->fi-m11 = i_report_line->fi-m11 + i_acdoca->hsl. "
      WHEN 12. i_report_line->fi-m12 = i_report_line->fi-m12 + i_acdoca->hsl. "
      WHEN 13. i_report_line->fi-m13 = i_report_line->fi-m13 + i_acdoca->hsl. "
      WHEN 14. i_report_line->fi-m14 = i_report_line->fi-m14 + i_acdoca->hsl. "
      WHEN 15. i_report_line->fi-m15 = i_report_line->fi-m15 + i_acdoca->hsl. "
      WHEN 16. i_report_line->fi-m16 = i_report_line->fi-m16 + i_acdoca->hsl. "
    ENDCASE.

    " 汇总外币数据
    CASE i_acdoca->poper.
      WHEN  0. i_report_line->fi_ksl-year_begin = i_report_line->fi_ksl-year_begin + i_acdoca->hsl.
      WHEN  1. i_report_line->fi_ksl-m01 = i_report_line->fi_ksl-m01 + i_acdoca->ksl.
      WHEN  2. i_report_line->fi_ksl-m02 = i_report_line->fi_ksl-m02 + i_acdoca->ksl.
      WHEN  3. i_report_line->fi_ksl-m03 = i_report_line->fi_ksl-m03 + i_acdoca->ksl.
      WHEN  4. i_report_line->fi_ksl-m04 = i_report_line->fi_ksl-m04 + i_acdoca->ksl.
      WHEN  5. i_report_line->fi_ksl-m05 = i_report_line->fi_ksl-m05 + i_acdoca->ksl.
      WHEN  6. i_report_line->fi_ksl-m06 = i_report_line->fi_ksl-m06 + i_acdoca->ksl.
      WHEN  7. i_report_line->fi_ksl-m07 = i_report_line->fi_ksl-m07 + i_acdoca->ksl.
      WHEN  8. i_report_line->fi_ksl-m08 = i_report_line->fi_ksl-m08 + i_acdoca->ksl.
      WHEN  9. i_report_line->fi_ksl-m09 = i_report_line->fi_ksl-m09 + i_acdoca->ksl.
      WHEN 10. i_report_line->fi_ksl-m10 = i_report_line->fi_ksl-m10 + i_acdoca->ksl.
      WHEN 11. i_report_line->fi_ksl-m11 = i_report_line->fi_ksl-m11 + i_acdoca->ksl.
      WHEN 12. i_report_line->fi_ksl-m12 = i_report_line->fi_ksl-m12 + i_acdoca->ksl.
      WHEN 13. i_report_line->fi_ksl-m13 = i_report_line->fi_ksl-m13 + i_acdoca->ksl.
      WHEN 14. i_report_line->fi_ksl-m14 = i_report_line->fi_ksl-m14 + i_acdoca->ksl.
      WHEN 15. i_report_line->fi_ksl-m15 = i_report_line->fi_ksl-m15 + i_acdoca->ksl.
      WHEN 16. i_report_line->fi_ksl-m16 = i_report_line->fi_ksl-m16 + i_acdoca->ksl.
    ENDCASE.

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method zcl_fi_report->_ADD_FI_FAGLFLEXT
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_REPORT_LINE                  TYPE REF TO ty_REPORT
* | [--->] I_FAGLFLEXT                    TYPE REF TO V_FAGLFLEXT_VIEW
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD _add_fi_faglflext.

    IF i_report_line IS NOT BOUND OR i_faglflext IS NOT BOUND.
      RETURN.
    ENDIF.

    " 财务数据
    i_report_line->fi-year_begin = i_report_line->fi-year_begin + i_faglflext->hslvt.
    i_report_line->fi-m01 = i_report_line->fi-m01 + i_faglflext->hsl01. "
    i_report_line->fi-m02 = i_report_line->fi-m02 + i_faglflext->hsl02. "
    i_report_line->fi-m03 = i_report_line->fi-m03 + i_faglflext->hsl03. "
    i_report_line->fi-m04 = i_report_line->fi-m04 + i_faglflext->hsl04. "
    i_report_line->fi-m05 = i_report_line->fi-m05 + i_faglflext->hsl05. "
    i_report_line->fi-m06 = i_report_line->fi-m06 + i_faglflext->hsl06. "
    i_report_line->fi-m07 = i_report_line->fi-m07 + i_faglflext->hsl07. "
    i_report_line->fi-m08 = i_report_line->fi-m08 + i_faglflext->hsl08. "
    i_report_line->fi-m09 = i_report_line->fi-m09 + i_faglflext->hsl09. "
    i_report_line->fi-m10 = i_report_line->fi-m10 + i_faglflext->hsl10. "
    i_report_line->fi-m11 = i_report_line->fi-m11 + i_faglflext->hsl11. "
    i_report_line->fi-m12 = i_report_line->fi-m12 + i_faglflext->hsl12. "
    i_report_line->fi-m13 = i_report_line->fi-m13 + i_faglflext->hsl13. "
    i_report_line->fi-m14 = i_report_line->fi-m14 + i_faglflext->hsl14. "
    i_report_line->fi-m15 = i_report_line->fi-m15 + i_faglflext->hsl15. "
    i_report_line->fi-m16 = i_report_line->fi-m16 + i_faglflext->hsl16. "

    " 外币数据
    i_report_line->fi_ksl-year_begin = i_report_line->fi_ksl-year_begin + i_faglflext->kslvt.
    i_report_line->fi_ksl-m01 = i_report_line->fi_ksl-m01 + i_faglflext->ksl01. "
    i_report_line->fi_ksl-m02 = i_report_line->fi_ksl-m02 + i_faglflext->ksl02. "
    i_report_line->fi_ksl-m03 = i_report_line->fi_ksl-m03 + i_faglflext->ksl03. "
    i_report_line->fi_ksl-m04 = i_report_line->fi_ksl-m04 + i_faglflext->ksl04. "
    i_report_line->fi_ksl-m05 = i_report_line->fi_ksl-m05 + i_faglflext->ksl05. "
    i_report_line->fi_ksl-m06 = i_report_line->fi_ksl-m06 + i_faglflext->ksl06. "
    i_report_line->fi_ksl-m07 = i_report_line->fi_ksl-m07 + i_faglflext->ksl07. "
    i_report_line->fi_ksl-m08 = i_report_line->fi_ksl-m08 + i_faglflext->ksl08. "
    i_report_line->fi_ksl-m09 = i_report_line->fi_ksl-m09 + i_faglflext->ksl09. "
    i_report_line->fi_ksl-m10 = i_report_line->fi_ksl-m10 + i_faglflext->ksl10. "
    i_report_line->fi_ksl-m11 = i_report_line->fi_ksl-m11 + i_faglflext->ksl11. "
    i_report_line->fi_ksl-m12 = i_report_line->fi_ksl-m12 + i_faglflext->ksl12. "
    i_report_line->fi_ksl-m13 = i_report_line->fi_ksl-m13 + i_faglflext->ksl13. "
    i_report_line->fi_ksl-m14 = i_report_line->fi_ksl-m14 + i_faglflext->ksl14. "
    i_report_line->fi_ksl-m15 = i_report_line->fi_ksl-m15 + i_faglflext->ksl15. "
    i_report_line->fi_ksl-m16 = i_report_line->fi_ksl-m16 + i_faglflext->ksl16. "

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method zcl_fi_report->_ADD_FI_REPORT_LINE
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_REPORT_LINE                  TYPE REF TO ty_REPORT
* | [--->] I_OTHER_LINE                   TYPE REF TO ty_REPORT
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD _add_fi_report_line.

    IF i_report_line IS NOT BOUND OR i_other_line IS NOT BOUND.
      RETURN.
    ENDIF.

    " 财务数据
    i_report_line->fi-year_begin = i_report_line->fi-year_begin + i_other_line->fi-year_begin. " 年初余额
    i_report_line->fi-m01 = i_report_line->fi-m01 + i_other_line->fi-m01. " 01月余额
    i_report_line->fi-m02 = i_report_line->fi-m02 + i_other_line->fi-m02. " 02月余额
    i_report_line->fi-m03 = i_report_line->fi-m03 + i_other_line->fi-m03. " 03月余额
    i_report_line->fi-m04 = i_report_line->fi-m04 + i_other_line->fi-m04. " 04月余额
    i_report_line->fi-m05 = i_report_line->fi-m05 + i_other_line->fi-m05. " 05月余额
    i_report_line->fi-m06 = i_report_line->fi-m06 + i_other_line->fi-m06. " 06月余额
    i_report_line->fi-m07 = i_report_line->fi-m07 + i_other_line->fi-m07. " 07月余额
    i_report_line->fi-m08 = i_report_line->fi-m08 + i_other_line->fi-m08. " 08月余额
    i_report_line->fi-m09 = i_report_line->fi-m09 + i_other_line->fi-m09. " 09月余额
    i_report_line->fi-m10 = i_report_line->fi-m10 + i_other_line->fi-m10. " 10月余额
    i_report_line->fi-m11 = i_report_line->fi-m11 + i_other_line->fi-m11. " 11月余额
    i_report_line->fi-m12 = i_report_line->fi-m12 + i_other_line->fi-m12. " 12月余额
    i_report_line->fi-m13 = i_report_line->fi-m13 + i_other_line->fi-m13. " 13月余额
    i_report_line->fi-m14 = i_report_line->fi-m14 + i_other_line->fi-m14. " 14月余额
    i_report_line->fi-m15 = i_report_line->fi-m15 + i_other_line->fi-m15. " 15月余额
    i_report_line->fi-m16 = i_report_line->fi-m16 + i_other_line->fi-m16. " 16月余额

    " 外币数据
    i_report_line->fi_ksl-year_begin = i_report_line->fi_ksl-year_begin + i_other_line->fi_ksl-year_begin. " 年初余额
    i_report_line->fi_ksl-m01 = i_report_line->fi_ksl-m01 + i_other_line->fi_ksl-m01. " 01月余额
    i_report_line->fi_ksl-m02 = i_report_line->fi_ksl-m02 + i_other_line->fi_ksl-m02. " 02月余额
    i_report_line->fi_ksl-m03 = i_report_line->fi_ksl-m03 + i_other_line->fi_ksl-m03. " 03月余额
    i_report_line->fi_ksl-m04 = i_report_line->fi_ksl-m04 + i_other_line->fi_ksl-m04. " 04月余额
    i_report_line->fi_ksl-m05 = i_report_line->fi_ksl-m05 + i_other_line->fi_ksl-m05. " 05月余额
    i_report_line->fi_ksl-m06 = i_report_line->fi_ksl-m06 + i_other_line->fi_ksl-m06. " 06月余额
    i_report_line->fi_ksl-m07 = i_report_line->fi_ksl-m07 + i_other_line->fi_ksl-m07. " 07月余额
    i_report_line->fi_ksl-m08 = i_report_line->fi_ksl-m08 + i_other_line->fi_ksl-m08. " 08月余额
    i_report_line->fi_ksl-m09 = i_report_line->fi_ksl-m09 + i_other_line->fi_ksl-m09. " 09月余额
    i_report_line->fi_ksl-m10 = i_report_line->fi_ksl-m10 + i_other_line->fi_ksl-m10. " 10月余额
    i_report_line->fi_ksl-m11 = i_report_line->fi_ksl-m11 + i_other_line->fi_ksl-m11. " 11月余额
    i_report_line->fi_ksl-m12 = i_report_line->fi_ksl-m12 + i_other_line->fi_ksl-m12. " 12月余额
    i_report_line->fi_ksl-m13 = i_report_line->fi_ksl-m13 + i_other_line->fi_ksl-m13. " 13月余额
    i_report_line->fi_ksl-m14 = i_report_line->fi_ksl-m14 + i_other_line->fi_ksl-m14. " 14月余额
    i_report_line->fi_ksl-m15 = i_report_line->fi_ksl-m15 + i_other_line->fi_ksl-m15. " 15月余额
    i_report_line->fi_ksl-m16 = i_report_line->fi_ksl-m16 + i_other_line->fi_ksl-m16. " 16月余额

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method zcl_fi_report->_CALC_FI
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_REPORT_LINE                  TYPE REF TO ty_REPORT
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD _calc_fi.

    " 计算各月余额
    i_report_line->fi-m01end = i_report_line->fi-m01 + i_report_line->fi-year_begin.
    i_report_line->fi-m02end = i_report_line->fi-m02 + i_report_line->fi-m01end.
    i_report_line->fi-m03end = i_report_line->fi-m03 + i_report_line->fi-m02end.
    i_report_line->fi-m04end = i_report_line->fi-m04 + i_report_line->fi-m03end.
    i_report_line->fi-m05end = i_report_line->fi-m05 + i_report_line->fi-m04end.
    i_report_line->fi-m06end = i_report_line->fi-m06 + i_report_line->fi-m05end.
    i_report_line->fi-m07end = i_report_line->fi-m07 + i_report_line->fi-m06end.
    i_report_line->fi-m08end = i_report_line->fi-m08 + i_report_line->fi-m07end.
    i_report_line->fi-m09end = i_report_line->fi-m09 + i_report_line->fi-m08end.
    i_report_line->fi-m10end = i_report_line->fi-m10 + i_report_line->fi-m09end.
    i_report_line->fi-m11end = i_report_line->fi-m11 + i_report_line->fi-m10end.
    i_report_line->fi-m12end = i_report_line->fi-m12 + i_report_line->fi-m11end.
    i_report_line->fi-m13end = i_report_line->fi-m13 + i_report_line->fi-m12end.
    i_report_line->fi-m14end = i_report_line->fi-m14 + i_report_line->fi-m13end.
    i_report_line->fi-m15end = i_report_line->fi-m15 + i_report_line->fi-m14end.
    i_report_line->fi-m16end = i_report_line->fi-m16 + i_report_line->fi-m15end.
    i_report_line->fi-year_end = i_report_line->fi-m16end.

    " 计算各季度发生额
    i_report_line->fi-q1 = i_report_line->fi-m01
                         + i_report_line->fi-m02
                         + i_report_line->fi-m03.
    i_report_line->fi-q2 = i_report_line->fi-m04
                         + i_report_line->fi-m05
                         + i_report_line->fi-m06.
    i_report_line->fi-q3 = i_report_line->fi-m07
                         + i_report_line->fi-m08
                         + i_report_line->fi-m09.
    i_report_line->fi-q4 = i_report_line->fi-m10
                         + i_report_line->fi-m11
                         + i_report_line->fi-m12
                         + i_report_line->fi-m13
                         + i_report_line->fi-m14
                         + i_report_line->fi-m15
                         + i_report_line->fi-m16.

    " 外币计算
    " 计算各季度余额
    i_report_line->fi-q1end = i_report_line->fi-q1 + i_report_line->fi-year_begin.
    i_report_line->fi-q2end = i_report_line->fi-q2 + i_report_line->fi-q1end.
    i_report_line->fi-q3end = i_report_line->fi-q3 + i_report_line->fi-q2end.
    i_report_line->fi-q4end = i_report_line->fi-q4 + i_report_line->fi-q3end.

    " 计算各月余额
    i_report_line->fi_ksl-m01end = i_report_line->fi_ksl-m01 + i_report_line->fi_ksl-year_begin.
    i_report_line->fi_ksl-m02end = i_report_line->fi_ksl-m02 + i_report_line->fi_ksl-m01end.
    i_report_line->fi_ksl-m03end = i_report_line->fi_ksl-m03 + i_report_line->fi_ksl-m02end.
    i_report_line->fi_ksl-m04end = i_report_line->fi_ksl-m04 + i_report_line->fi_ksl-m03end.
    i_report_line->fi_ksl-m05end = i_report_line->fi_ksl-m05 + i_report_line->fi_ksl-m04end.
    i_report_line->fi_ksl-m06end = i_report_line->fi_ksl-m06 + i_report_line->fi_ksl-m05end.
    i_report_line->fi_ksl-m07end = i_report_line->fi_ksl-m07 + i_report_line->fi_ksl-m06end.
    i_report_line->fi_ksl-m08end = i_report_line->fi_ksl-m08 + i_report_line->fi_ksl-m07end.
    i_report_line->fi_ksl-m09end = i_report_line->fi_ksl-m09 + i_report_line->fi_ksl-m08end.
    i_report_line->fi_ksl-m10end = i_report_line->fi_ksl-m10 + i_report_line->fi_ksl-m09end.
    i_report_line->fi_ksl-m11end = i_report_line->fi_ksl-m11 + i_report_line->fi_ksl-m10end.
    i_report_line->fi_ksl-m12end = i_report_line->fi_ksl-m12 + i_report_line->fi_ksl-m11end.
    i_report_line->fi_ksl-m13end = i_report_line->fi_ksl-m13 + i_report_line->fi_ksl-m12end.
    i_report_line->fi_ksl-m14end = i_report_line->fi_ksl-m14 + i_report_line->fi_ksl-m13end.
    i_report_line->fi_ksl-m15end = i_report_line->fi_ksl-m15 + i_report_line->fi_ksl-m14end.
    i_report_line->fi_ksl-m16end = i_report_line->fi_ksl-m16 + i_report_line->fi_ksl-m15end.
    i_report_line->fi_ksl-year_end = i_report_line->fi_ksl-m16end.

    " 计算各季度发生额
    i_report_line->fi_ksl-q1 = i_report_line->fi_ksl-m01
                            + i_report_line->fi_ksl-m02
                            + i_report_line->fi_ksl-m03.
    i_report_line->fi_ksl-q2 = i_report_line->fi_ksl-m04
                            + i_report_line->fi_ksl-m05
                            + i_report_line->fi_ksl-m06.
    i_report_line->fi_ksl-q3 = i_report_line->fi_ksl-m07
                            + i_report_line->fi_ksl-m08
                            + i_report_line->fi_ksl-m09.
    i_report_line->fi_ksl-q4 = i_report_line->fi_ksl-m10
                            + i_report_line->fi_ksl-m11
                            + i_report_line->fi_ksl-m12
                            + i_report_line->fi_ksl-m13
                            + i_report_line->fi_ksl-m14
                            + i_report_line->fi_ksl-m15
                            + i_report_line->fi_ksl-m16.

    " 计算各季度余额
    i_report_line->fi_ksl-q1end = i_report_line->fi_ksl-q1 + i_report_line->fi_ksl-year_begin.
    i_report_line->fi_ksl-q2end = i_report_line->fi_ksl-q2 + i_report_line->fi_ksl-q1end.
    i_report_line->fi_ksl-q3end = i_report_line->fi_ksl-q3 + i_report_line->fi_ksl-q2end.
    i_report_line->fi_ksl-q4end = i_report_line->fi_ksl-q4 + i_report_line->fi_ksl-q3end.

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method zcl_fi_report->_GET_DATA
* +-------------------------------------------------------------------------------------------------+
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD _get_data.

    IF mt_report IS INITIAL.
      RETURN.
    ENDIF.

    " 四项基础项
    DATA lt_rldnr_opt TYPE RANGE OF acdoca-rldnr.
    DATA lt_rbukrs_opt TYPE RANGE OF acdoca-rbukrs.
    DATA lt_ryear_opt TYPE RANGE OF acdoca-ryear.
    DATA lt_racct_opt TYPE RANGE OF acdoca-racct.

    " 账目表
    IF m_rldnr IS NOT INITIAL.
      INSERT VALUE #(
        sign = 'I'
        option = 'EQ'
        low = m_rldnr
      ) INTO TABLE lt_rldnr_opt.
    ENDIF.

    " 公司
    IF m_rbukrs IS NOT INITIAL.
      INSERT VALUE #(
        sign = 'I'
        option = 'EQ'
        low = m_rbukrs
      ) INTO TABLE lt_rbukrs_opt.
    ENDIF.

    " 年度
    IF m_ryear IS NOT INITIAL.
      INSERT VALUE #(
        sign = 'I'
        option = 'EQ'
        low = m_ryear
      ) INTO TABLE lt_ryear_opt.
    ENDIF.

    " 科目
    LOOP AT mt_report REFERENCE INTO DATA(lr_report).
      INSERT LINES OF lr_report->t_racct_opt INTO TABLE lt_racct_opt.
    ENDLOOP.

    "
    SORT lt_racct_opt.
    DELETE ADJACENT DUPLICATES FROM lt_racct_opt COMPARING ALL FIELDS.

    CASE m_datatab.
      WHEN cns_datatab-acdoca.
        " TODO: 字段应该也能动态，后面再调整
        SELECT
          rldnr,
          rbukrs,
          gjahr,
          belnr,
          docln,
          ryear,
          poper,
          racct,
          rcntr,
          prctr,
          rfarea,
          rbusa,
          budat,
          hsl,
          ksl
          FROM acdoca
          WHERE rldnr IN @lt_rldnr_opt
            AND rbukrs IN @lt_rbukrs_opt
            AND ryear IN @lt_ryear_opt
            AND racct IN @lt_racct_opt
          INTO CORRESPONDING FIELDS OF TABLE @mt_acdoca.

      WHEN cns_datatab-faglflext.
        " TODO: 字段应该也能动态，后面再调整
        SELECT
          rldnr,
          rbukrs,
          ryear,
          racct,
          rcntr,
          prctr,
          rfarea,
          rbusa,
          hslvt,
          hsl01,
          hsl02,
          hsl03,
          hsl04,
          hsl05,
          hsl06,
          hsl07,
          hsl08,
          hsl09,
          hsl10,
          hsl11,
          hsl12,
          hsl13,
          hsl14,
          hsl15,
          hsl16,
          kslvt,
          ksl01,
          ksl02,
          ksl03,
          ksl04,
          ksl05,
          ksl06,
          ksl07,
          ksl08,
          ksl09,
          ksl10,
          ksl11,
          ksl12,
          ksl13,
          ksl14,
          ksl15,
          ksl16
          FROM v_faglflext_view
          WHERE rldnr IN @lt_rldnr_opt
            AND rbukrs IN @lt_rbukrs_opt
            AND ryear IN @lt_ryear_opt
            AND racct IN @lt_racct_opt
          INTO CORRESPONDING FIELDS OF TABLE @mt_faglflext.

      WHEN OTHERS.
    ENDCASE.

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method zcl_fi_report->_inverse_FI
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_REPORT_LINE                  TYPE REF TO ty_REPORT
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD _inverse_fi.

    IF i_report_line IS NOT BOUND.
      RETURN.
    ENDIF.

    " 财务数据
    i_report_line->fi-year_begin = 0 - i_report_line->fi-year_begin. " 年初余额
    i_report_line->fi-m01  = 0 - i_report_line->fi-m01 . " 01月余额
    i_report_line->fi-m02  = 0 - i_report_line->fi-m02 . " 02月余额
    i_report_line->fi-m03  = 0 - i_report_line->fi-m03 . " 03月余额
    i_report_line->fi-m04  = 0 - i_report_line->fi-m04 . " 04月余额
    i_report_line->fi-m05  = 0 - i_report_line->fi-m05 . " 05月余额
    i_report_line->fi-m06  = 0 - i_report_line->fi-m06 . " 06月余额
    i_report_line->fi-m07  = 0 - i_report_line->fi-m07 . " 07月余额
    i_report_line->fi-m08  = 0 - i_report_line->fi-m08 . " 08月余额
    i_report_line->fi-m09  = 0 - i_report_line->fi-m09 . " 09月余额
    i_report_line->fi-m10  = 0 - i_report_line->fi-m10 . " 10月余额
    i_report_line->fi-m11  = 0 - i_report_line->fi-m11 . " 11月余额
    i_report_line->fi-m12  = 0 - i_report_line->fi-m12 . " 12月余额
    i_report_line->fi-m13  = 0 - i_report_line->fi-m13 . " 13月余额
    i_report_line->fi-m14  = 0 - i_report_line->fi-m14 . " 14月余额
    i_report_line->fi-m15  = 0 - i_report_line->fi-m15 . " 15月余额
    i_report_line->fi-m16  = 0 - i_report_line->fi-m16 . " 16月余额

    " 外币数据
    i_report_line->fi_ksl-year_begin = 0 - i_report_line->fi_ksl-year_begin. " 年初余额
    i_report_line->fi_ksl-m01  = 0 - i_report_line->fi_ksl-m01 . " 01月余额
    i_report_line->fi_ksl-m02  = 0 - i_report_line->fi_ksl-m02 . " 02月余额
    i_report_line->fi_ksl-m03  = 0 - i_report_line->fi_ksl-m03 . " 03月余额
    i_report_line->fi_ksl-m04  = 0 - i_report_line->fi_ksl-m04 . " 04月余额
    i_report_line->fi_ksl-m05  = 0 - i_report_line->fi_ksl-m05 . " 05月余额
    i_report_line->fi_ksl-m06  = 0 - i_report_line->fi_ksl-m06 . " 06月余额
    i_report_line->fi_ksl-m07  = 0 - i_report_line->fi_ksl-m07 . " 07月余额
    i_report_line->fi_ksl-m08  = 0 - i_report_line->fi_ksl-m08 . " 08月余额
    i_report_line->fi_ksl-m09  = 0 - i_report_line->fi_ksl-m09 . " 09月余额
    i_report_line->fi_ksl-m10  = 0 - i_report_line->fi_ksl-m10 . " 10月余额
    i_report_line->fi_ksl-m11  = 0 - i_report_line->fi_ksl-m11 . " 11月余额
    i_report_line->fi_ksl-m12  = 0 - i_report_line->fi_ksl-m12 . " 12月余额
    i_report_line->fi_ksl-m13  = 0 - i_report_line->fi_ksl-m13 . " 13月余额
    i_report_line->fi_ksl-m14  = 0 - i_report_line->fi_ksl-m14 . " 14月余额
    i_report_line->fi_ksl-m15  = 0 - i_report_line->fi_ksl-m15 . " 15月余额
    i_report_line->fi_ksl-m16  = 0 - i_report_line->fi_ksl-m16 . " 16月余额

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method zcl_fi_report->_SET_GLOBAL_FILTER
* +-------------------------------------------------------------------------------------------------+
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD _set_global_filter.

    " 作用到全局的筛选项
    DATA lv_where TYPE string.
    LOOP AT mt_filter REFERENCE INTO DATA(lr_filter) WHERE t_select_opt IS NOT INITIAL.
      "
      lv_where = |{ lr_filter->name } NOT IN LR_FILTER->T_SELECT_OPT|.
      "
      IF mt_acdoca IS NOT INITIAL.
        DELETE mt_acdoca WHERE (lv_where).
      ENDIF.
      "
      IF mt_faglflext IS NOT INITIAL.
        DELETE mt_faglflext WHERE (lv_where).
      ENDIF.
    ENDLOOP.

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method zcl_fi_report->_SET_REPORT_LINE
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_REPORT_LINE                  TYPE REF TO ty_REPORT
* | [--->] I_DEPTH                        TYPE        I(optional)
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD _set_report_line.

    IF i_depth > 10 " 迭代层级，防止栈溢出
    OR i_report_line IS NOT BOUND " 空值检查
    OR i_report_line->processed IS NOT INITIAL " 处理标记检查，防止死循环，以及跳过冗余计算
    .
      RETURN.
    ENDIF.

    " 进度展示
    i_report_line->processed = 'P'. " 处理中

    " 取全部，后续逐步去除不符合条件的数据
    DATA(lt_acdoca) = mt_acdoca.
    DATA(lt_faglflext) = mt_faglflext.

    " 获取当前配置行的有效数据
    IF i_report_line->t_racct_opt IS NOT INITIAL.
      DELETE lt_acdoca WHERE racct NOT IN i_report_line->t_racct_opt.
      DELETE lt_faglflext WHERE racct NOT IN i_report_line->t_racct_opt.
    ENDIF.

    " 特殊处理
    LOOP AT i_report_line->t_customize REFERENCE INTO DATA(lr_customize).
      " 函数
      IF lr_customize->function IS NOT INITIAL.
        CALL FUNCTION lr_customize->function
          EXPORTING
            i_report_line = i_report_line
          CHANGING
            c_acdoca      = lt_acdoca
            c_faglflext   = lt_faglflext.
      ENDIF.

      " 静态类方法
      IF lr_customize->class IS NOT INITIAL AND lr_customize->method IS NOT INITIAL.
        CALL METHOD (lr_customize->class)=>(lr_customize->method)
          EXPORTING
            i_report_line = i_report_line
          CHANGING
            c_acdoca      = lt_acdoca
            c_faglflext   = lt_faglflext.
      ENDIF.

      " 子例程
      IF lr_customize->progrom IS NOT INITIAL AND lr_customize->subroutine IS NOT INITIAL.
        PERFORM (lr_customize->subroutine) IN PROGRAM (lr_customize->progrom) IF FOUND
          TABLES lt_acdoca lt_faglflext USING i_report_line.
      ENDIF.
    ENDLOOP.

    " 除科目外，其他筛选项动态处理
    DATA lv_where TYPE string.
    IF i_report_line->t_filter IS NOT INITIAL.
      LOOP AT i_report_line->t_filter REFERENCE INTO DATA(lr_filter) WHERE t_select_opt IS NOT INITIAL.
        "
        lv_where = |{ lr_filter->name } NOT IN LR_FILTER->T_SELECT_OPT|.
        "
        IF lt_acdoca IS NOT INITIAL.
          DELETE lt_acdoca WHERE (lv_where).
        ENDIF.
        "
        IF lt_faglflext IS NOT INITIAL.
          DELETE lt_faglflext WHERE (lv_where).
        ENDIF.
      ENDLOOP.
    ENDIF.

    " 对于ACDOCA表数据的处理
    LOOP AT lt_acdoca REFERENCE INTO DATA(lr_acdoca).
      " 汇总ACDOCA数据
      _add_fi_acdoca( i_report_line = i_report_line
                      i_acdoca      = lr_acdoca ).
      " 如果从ACDOCA表取值，还可以将凭证行存储起来，用于展示数据是如何汇总的
      INSERT CORRESPONDING #( lr_acdoca->* ) INTO TABLE i_report_line->t_detail.
    ENDLOOP.

    " 对于FAGLFLEXT表数据的处理
    LOOP AT lt_faglflext REFERENCE INTO DATA(lr_faglflext).
      " 汇总FAGLFLEXT数据
      _add_fi_faglflext( i_report_line = i_report_line
                         i_faglflext   = lr_faglflext ).
    ENDLOOP.

    " 计算项目处理
    LOOP AT i_report_line->t_child REFERENCE INTO DATA(lr_child).
      READ TABLE mt_report REFERENCE INTO DATA(lr_report_line_child) WITH KEY
      zitem = lr_child->zitem
      BINARY SEARCH.
      IF sy-subrc = 0.
        " 递归取值
        _set_report_line( i_report_line = lr_report_line_child i_depth = i_depth + 1 ).
        " 置反金额
        IF lr_child->zsign = cns_sign-minus.
          _inverse_fi( i_report_line ).
        ENDIF.
        " 汇总其他项目数据
        _add_fi_report_line( i_report_line = i_report_line
                             i_other_line  = lr_report_line_child ).
        " 加完再返回来
        " （因为是引用结构，前面的置反会修改源数据，换成结构再引用就不需要这步操作了）
        IF lr_child->zsign = cns_sign-minus.
          _inverse_fi( i_report_line ).
        ENDIF.
      ENDIF.
    ENDLOOP.

    " 反向标记
    IF i_report_line->inverse IS NOT INITIAL.
      " 置反金额
      _inverse_fi( i_report_line ).
    ENDIF.

    " 其他数据计算
    _calc_fi( i_report_line ).

    i_report_line->processed = abap_true. " 处理完成

  ENDMETHOD.
ENDCLASS.

```

</details>
