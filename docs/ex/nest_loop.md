# 嵌套循环优化

网上分析挺多，我就不重复了，直接上几个有效的优化方案。

## 二分循环

<details>
<summary>示例代码</summary>

```abap

TYPES:
  BEGIN OF ty_data,
    field1 TYPE string,
    field2 TYPE string,
  END OF ty_data.

DATA:
  lt_head TYPE STANDARD TABLE OF ty_data,
  ls_head TYPE ty_data,
  lt_item TYPE STANDARD TABLE OF ty_data,
  ls_item TYPE ty_data.

SORT lt_item BY field1 field2.

LOOP AT lt_head INTO ls_head.
  READ TABLE lt_item TRANSPORTING NO FIELDS WITH KEY field1 = ls_head-field1 BINARY SEARCH.
  IF sy-subrc = 0.
    LOOP AT lt_item INTO ls_item FROM sy-tabix.
      IF ls_item-field1 <> ls_head-field1.
        EXIT.
      ENDIF.
      " write something...
    ENDLOOP.
  ENDIF.
ENDLOOP.

```

</details>

## 分组

算是一种偷懒的写法。

<details>
<summary>示例代码</summary>

```abap

TYPES:
  BEGIN OF ty_data,
    field1 TYPE string,
    field2 TYPE string,
  END OF ty_data.

DATA:
  lt_head TYPE STANDARD TABLE OF ty_data,
  ls_head TYPE ty_data,
  lt_item TYPE STANDARD TABLE OF ty_data,
  ls_item TYPE ty_data.

LOOP AT lt_head INTO ls_head.
  LOOP AT lt_item TRANSPORTING NO FIELDS WHERE field1 = ls_head-field1
    GROUP BY ( field1 = ls_head-field1 ) INTO DATA(ls_item_grp).
    LOOP AT GROUP ls_item_grp INTO ls_item.
      " write something...
    ENDLOOP.
  ENDLOOP.
ENDLOOP.

```

</details>