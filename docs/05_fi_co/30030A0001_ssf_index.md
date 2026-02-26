# 共享财务

项目上有接触，但不是核心开发，下面是一些常用的取值。

## 服务目录

<details open>
  <summary>三级服务目录取值</summary>

```SQL
@AbapCatalog.viewEnhancementCategory: [#NONE]
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Service Catalog'
@Metadata.ignorePropagatedAnnotations: true
@Metadata.allowExtensions: true
define view entity ZSSFI_Category
  as select from    crmc_erms_cat_hi as l1

    join            crmc_erms_cat_ca as c1  on l1.node_guid = c1.cat_guid
    join            crmc_erms_cat_as as asp on  c1.asp_guid   = asp.asp_guid
                                            and asp.asp_state = 'R'

    left outer join crmc_erms_cat_cd as t1  on  t1.lang     = '1'
                                            and c1.cat_guid = t1.cat_guid

    join            crmc_erms_cat_hi as l2  on l1.node_guid = l2.pare_guid
    join            crmc_erms_cat_ca as c2  on l2.node_guid = c2.cat_guid
    left outer join crmc_erms_cat_cd as t2  on  t2.lang     = '1'
                                            and c2.cat_guid = t2.cat_guid

    join            crmc_erms_cat_hi as l3  on l2.node_guid = l3.pare_guid
    join            crmc_erms_cat_ca as c3  on l3.node_guid = c3.cat_guid
    left outer join crmc_erms_cat_cd as t3  on  t3.lang     = '1'
                                            and c3.cat_guid = t3.cat_guid
{
       @ObjectModel.text.element: [ 'CatLabel1' ]
       @UI.textArrangement: #TEXT_LAST
  key  cast(c1.cat_id as zssfe_cat01)          as CatId1,
       @ObjectModel.text.element: [ 'CatLabel2' ]
       @UI.textArrangement: #TEXT_LAST
  key  cast(c2.cat_id as zssfe_cat02)          as CatId2,
       @ObjectModel.text.element: [ 'CatLabel3' ]
       @UI.textArrangement: #TEXT_LAST
  key  cast(c3.cat_id as zssfe_cat03)          as CatId3,
       cast(t1.cat_label as zssfe_cat01_label) as CatLabel1,
       cast(t2.cat_label as zssfe_cat02_label) as CatLabel2,
       cast(t3.cat_label as zssfe_cat03_label) as CatLabel3
}
group by
  c1.cat_id,
  c2.cat_id,
  c3.cat_id,
  t1.cat_label,
  t2.cat_label,
  t3.cat_label
```

</details>
