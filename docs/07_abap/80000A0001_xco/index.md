# XCO库

XCO能用到的东西不多，下面列举一些：

需要注意，XCO库有两个版本：

- **XCO_\*** ，主要用在On-premise上
- **XCO_CP_\*** ，主要用在Clound上

> [官方文档](https://help.sap.com/docs/sap-btp-abap-environment/abap-environment/standard-library)

## 日期时间

<details open>
  <summary>基于XCO的日期时间处理</summary>

```ABAP
" 日期、时间、时间戳
DATA(lo_date) = xco=>sy->date( ).
DATA(lo_time) = xco=>sy->time( ).
DATA(lo_timestamp) = xco=>sy->moment( ).

" 日期加减
DATA(lo_date_before) = lo_date->add(
  iv_year  = -1
  iv_month = -1
  iv_day   = -1 ).
DATA(lv_data_before) = lo_date_before->as( xco_time=>format-abap ).

DATA(lo_date_after) = lo_date->add(
  iv_year  = 1
  iv_month = 1
  iv_day   = 1 ).
DATA(lv_date_after) = lo_date_after->as( xco_time=>format-abap ).
    
" 时间和时间戳同理，不累述
```

</details>

## UUID

这个可以，不用每次生成UUID都去TryCatch错误了

<details open>
  <summary>基于XCO的UUID生成</summary>

```ABAP
DATA(lv_uuid_x16) = xco=>uuid( )->value. " SYSUUID_X16
DATA(lv_uuid_c32) = xco=>uuid( )->as( xco_uuid=>format-c32 )->value. " STRING
```

</details>

## 域值

> 参考[基于XCO的域值取值工具](/ABAP-DevNotes/07_abap/80010A0007_zcl_text.md#xco_1)

## JSON

不知道和/UI2/CL_JSON相比如何，后面用到再补充。

## EXCEL

不知道和CL_EHFND_XLSX、ABAP2XLSX相比如何，后面用到再补充。

## 正则

后面用到再补充。
