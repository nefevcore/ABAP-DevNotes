# 示例

[财务报表](../05_fi_co/30010A0008_01_fi_report.md)示例。

## 配置参考

具体配置表看自己项目要求，可以参考下面配置表（无公式配置）：

<details open>
  <summary>示例配置</summary>

```SQL
@EndUserText.label : '配置表1'
@AbapCatalog.enhancementCategory : #NOT_CLASSIFIED
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #ALLOWED
define table zfit0001 {
  key mandt : mandt not null;
  @EndUserText.label : '报表'
  key zreport    : abap.char(10) not null;
  @EndUserText.label : '项目标识'
  key zitem      : abap.char(30) not null;
  @EndUserText.label : '项目描述'
  ztext          : abap.char(30);
  @EndUserText.label : '顺序'
  zindex         : syindex;
  @EndUserText.label : '负数'
  zinverse       : xfeld;

}

@EndUserText.label : '配置表2'
@AbapCatalog.enhancementCategory : #NOT_CLASSIFIED
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #ALLOWED
define table zfit0002 {
  key mandt : mandt not null;
  @EndUserText.label : '项目标识'
  key zitem      : abap.char(30) not null;
  @EndUserText.label : '行项目'
  key znum       : abap.numc(3) not null;
  @EndUserText.label : '科目从'
  racct_from     : racct;
  @EndUserText.label : '科目到'
  racct_to       : racct;
  @EndUserText.label : '子项目'
  zchild         : abap.char(30);
  @EndUserText.label : '负数'
  zinverse       : xfeld;
  @EndUserText.label : '原因代码'
  rstgr          : rstgr;
  @EndUserText.label : '功能范围'
  rfarea         : fkber;

}
```

</details>

根据zitem_from，zitem_to，zreverse三个字段，就可以实现不同项目的加减计算，比如项目1 = 项目2 - 项目3 + 项目4 - 项目5，按下面配置:

| 项目 | 项目从 | 反向标识 |
| - | - | - |
| 项目1 | 项目2 | |
| 项目1 | 项目3 | X |
| 项目1 | 项目4 | |
| 项目1 | 项目5 | X |

## 演示程序

<details>
  <summary>示例类</summary>

```ABAP

CLASS zcl_fi_report_sample DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC .

  PUBLIC SECTION.
    TYPES ty_amount TYPE p LENGTH 16 DECIMALS 2.
    TYPES:
      BEGIN OF ty_data,
        zindex             TYPE sy-tabix,
        zitemid            TYPE char20,
        zitemtext          TYPE char40,
        current_period     TYPE ty_amount,
        current_period_end TYPE ty_amount,
        year_begin         TYPE ty_amount,
        year_end           TYPE ty_amount,
      END OF ty_data.
    TYPES:
      ty_data_t TYPE STANDARD TABLE OF ty_data.

    METHODS read IMPORTING i_report TYPE char30
                           i_bukrs  TYPE bukrs
                           i_year   TYPE gjahr
                           i_month  TYPE poper
                 EXPORTING e_data   TYPE ty_data_t.
  PROTECTED SECTION.
  PRIVATE SECTION.
    DATA gv_dummy TYPE string.
    DATA mt_report TYPE STANDARD TABLE OF ty_data.

    METHODS _read_report_setting
      IMPORTING
        !i_report       TYPE char30
      RETURNING
        VALUE(r_report) TYPE zcl_fi_report=>ty_report_t .
    METHODS _get_fi_field
      IMPORTING
        !i_fi        TYPE REF TO zcl_fi_report=>ty_fi_data
        !i_fieldname TYPE fieldname
      EXPORTING
        !e_value     TYPE data .
ENDCLASS.



CLASS zcl_fi_report_sample IMPLEMENTATION.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Public Method zcl_fi_report_sample->READ
* +-------------------------------------------------------------------------------------------------+
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD read.

    " 报表
    DATA lt_report TYPE zcl_fi_report=>ty_report_t.
    
    " 动态参数
    DATA lv_fieldname TYPE char30.
    DATA lv_n2 TYPE n LENGTH 2.
    FIELD-SYMBOLS <fs_amount> TYPE zcl_fi_report=>ty_amount.

    " 从T表取值
    zcl_fi_report=>from_table( zcl_fi_report=>cns_datatab-faglflext ).

    " 读取报表样式
    DATA(lt_report_templete) = _read_report_setting( i_report ).

    " 主报表
    lt_report = lt_report_templete.
    zcl_fi_report=>execute( EXPORTING i_rbukrs = i_bukrs
                                      i_ryear  = i_year
                            CHANGING  c_report = lt_report ).

    " 转换报表结果到前台显示所需
    SORT lt_report BY zindex.
    LOOP AT lt_report REFERENCE INTO DATA(lr_report).
      " 报表财务数据
      DATA(lr_fi) = REF #( lr_report->fi ).

      DATA ls_data TYPE ty_data.
      CLEAR ls_data.
      ls_data-bukrs = i_bukrs.

      " 报表项目序号
      ls_data-zindex = lr_report->zindex.
      " 报表项目
      ls_data-zitemid = lr_report->zitem.
      " 报表描述
      ls_data-zitemtext = lr_report->ztext.

      " 年初余额
      ls_data-year_begin = lr_fi->year_begin.
      " 年末余额
      ls_data-year_end = lr_fi->year_end.

      " 当前期间发生额
      lv_n2 = i_month.
      lv_fieldname = |M{ lv_n2 ALPHA = IN }|.
      _get_fi_field( EXPORTING i_fi        = lr_fi
                               i_fieldname = lv_fieldname
                     IMPORTING e_value     = ls_data-current_period ).
      " 当前期间余额
      lv_n2 = i_month.
      IF i_month = 12.
        lv_n2 = 16.
      ENDIF.
      lv_fieldname = |M{ lv_n2 ALPHA = IN }END|.
      _get_fi_field( EXPORTING i_fi        = lr_fi
                               i_fieldname = lv_fieldname
                     IMPORTING e_value     = ls_data-current_period_end ).

      INSERT ls_data INTO TABLE e_data.
    ENDLOOP.

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method zcl_fi_report_sample->_GET_FI_FIELD
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_FI                           TYPE REF TO zcl_fi_report=>TY_FI_DATA
* | [--->] I_FIELDNAME                    TYPE        FIELDNAME
* | [<---] E_VALUE                        TYPE        DATA
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD _get_fi_field.

    FIELD-SYMBOLS <fs_field> TYPE any.
    ASSIGN i_fi->(i_fieldname) TO <fs_field>.
    IF <fs_field> IS ASSIGNED.
      e_value = <fs_field>.
    ENDIF.

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method zcl_fi_report_sample->_READ_REPORT_SETTING
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_REPORT                       TYPE        CHAR30
* | [--->] I_FILTER                       TYPE        zcl_fi_report=>TY_FILTER_T(optional)
* | [<-()] R_REPORT                       TYPE        zcl_fi_report=>TY_REPORT_T
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD _read_report_setting.

    " 配置表1
    SELECT *
      FROM @gt_zfit0001 AS ds
      WHERE zreport = @i_report
      INTO TABLE @DATA(lt_zfit0001).
    IF sy-subrc <> 0.
      CLEAR lt_zfit0001.
    ENDIF.

    " 配置表2
    SELECT *
      FROM @gt_zfit0002 AS ds
      WHERE zreport = @i_report
      INTO TABLE @DATA(lt_zfit0002).
    IF sy-subrc <> 0.
      CLEAR lt_zfit0002.
    ENDIF.

    DATA lt_report TYPE STANDARD TABLE OF zcl_fi_report=>ty_report.
    DATA ls_report TYPE zcl_fi_report=>ty_report.
    DATA lt_select_opt TYPE zcl_fi_report=>ty_filter-t_select_opt.
    DATA ls_select_opt LIKE LINE OF lt_select_opt.
    DATA ls_racct_opt LIKE LINE OF ls_report-t_racct_opt.

    "
    LOOP AT lt_zfit0001 REFERENCE INTO DATA(lr_zfit0001).
      CLEAR ls_report.
      ls_report-zindex = lr_zfit0001->zindex. " 序号
      ls_report-zitem = lr_zfit0001->zitem. " 项目
      ls_report-ztext = lr_zfit0001->ztext.
      ls_report-zinverse = lr_zfit0001->zinverse. " 负数显示
      ls_report-processed = abap_true. " 行如果没有任何筛选项，则无需查询
      INSERT ls_report INTO TABLE lt_report.
    ENDLOOP.
    SORT lt_report BY zitem.

    LOOP AT lt_zfit0002 REFERENCE INTO DATA(lr_zfit0002).
      READ TABLE lt_report REFERENCE INTO DATA(lr_report) WITH KEY zitem = lr_zfit0002->zitem BINARY SEARCH.
      IF sy-subrc <> 0.
        CONTINUE.
      ENDIF.
      CLEAR lr_report->processed.
      " 科目范围筛选
      IF lr_zfit0002->racct_from IS NOT INITIAL.
        CLEAR ls_racct_opt.
        ls_racct_opt-sign = 'I'.
        ls_racct_opt-option = 'BT'.
        ls_racct_opt-low = lr_zfit0002->racct_from.
        ls_racct_opt-high = lr_zfit0002->racct_to.
        INSERT ls_racct_opt INTO TABLE lr_report->t_racct_opt.
      ENDIF.

      " 其他范围筛选
      IF lr_zfit0002->rstgr IS NOT INITIAL.
        CLEAR lt_select_opt.
        CLEAR ls_select_opt.
        ls_select_opt-sign = 'I'.
        ls_select_opt-option = 'BT'.
        ls_select_opt-low = lr_zfit0002->rstgr.
        INSERT ls_select_opt INTO TABLE lt_select_opt.
        INSERT VALUE #(
          name = 'RSTGR'
          t_select_opt = lt_select_opt
        ) INTO TABLE lr_report->t_filter.
      ENDIF.

      " 其他范围筛选
      IF lr_zfit0002->rfarea IS NOT INITIAL.
        CLEAR lt_select_opt.
        CLEAR ls_select_opt.
        ls_select_opt-sign = 'I'.
        ls_select_opt-option = 'BT'.
        ls_select_opt-low = lr_zfit0002->rfarea.
        INSERT ls_select_opt INTO TABLE lt_select_opt.
        INSERT VALUE #(
          name = 'RFAREA'
          t_select_opt = lt_select_opt
        ) INTO TABLE lr_report->t_filter.
      ENDIF.

      " 汇总项
      IF lr_zfit0002->zchild IS NOT INITIAL.
        " 汇总符号
        DATA l_sign.
        l_sign = '+'.
        IF lr_zfit0002->zinverse IS NOT INITIAL.
          l_sign = '-'.
        ENDIF.
        " 汇总项
        INSERT VALUE #(
          zitem = lr_zfit0002->zchild
          zsign = l_sign
        ) INTO TABLE lr_report->t_child.
        " 汇总项不需要财务数据，而是从其他项汇总
        INSERT VALUE #(
          class = 'ZCL_FI_REPORT'
          method = 'CUS_CLEAR_DATA'
        ) INTO TABLE lr_report->t_customize.
      ENDIF.
    ENDLOOP.

    r_report = lt_report.

  ENDMETHOD.

ENDCLASS.

```

</details>
