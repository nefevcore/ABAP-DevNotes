# 三大报表配置表参考

具体配置表看自己项目要求，可以参考下面配置表（无公式配置）：

```SQL

@EndUserText.label : '三大报表配置表'
@AbapCatalog.enhancementCategory : #NOT_CLASSIFIED
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #ALLOWED
define table zfit0001 {
  key mandt : mandt not null;
  @EndUserText.label : '1[资产负债表]；2[利润表]；3[现金流量表]'
  key zfi_report : abap.char(1) not null;
  @EndUserText.label : '公司'
  key bukrs      : bukrs not null;
  @EndUserText.label : '项目'
  key zitem      : abap.numc(3) not null;
  @EndUserText.label : '子项目'
  key zitem_sub  : abap.numc(3) not null;
  @EndUserText.label : '子项目'
  ztext          : abap.char(30);
  @EndUserText.label : '计算类型；1[文本]，2[科目]，3[下级汇总]'
  ztype          : abap.char(1);
  @EndUserText.label : '科目从'
  racct_from     : racct;
  @EndUserText.label : '科目到'
  racct_to       : racct;
  @EndUserText.label : '项目从'
  zitem_from     : abap.numc(3);
  @EndUserText.label : '项目到'
  zitem_to       : abap.numc(3);
  @EndUserText.label : '反向标识'
  zreverse       : xfeld;
  @EndUserText.label : '原因代码'
  rstgr          : rstgr;
  @EndUserText.label : '功能范围'
  rfarea         : fkber;
  upnam          : uname;
  updat          : datum;
  uptim          : uzeit;

}

```

根据zitem_from，zitem_to，zreverse三个字段，就可以实现不同项目的加减计算，比如项目1 = 项目2 - 项目3 + 项目4 - 项目5，按下面配置:

| 项目 | 子项目 | 项目文本 | 项目从 | 反向标识 |
|-|-|-|-|-|
| 1 | 1 | 项目1 = | | |
| 1 | 2 | + 项目2 | 2 | |
| 1 | 3 | - 项目3 | 3 | X |
| 1 | 4 | + 项目4 | 4 | |
| 1 | 5 | - 项目5 | 4 | X |
