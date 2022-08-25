# MIGO

MIGO功能强大，在前台根据操作类型、凭证类型、移动类型，可实现不同效果的库存管理。其对应BAPI，***BAPI_GOODSMVT_CREATE***，也有着强大的作用，我尽可能把各种场景的代码都列示。

## 参数说明

### GM_CODE

关于GM_CODE传值作用：

| GM_CODE | 事务代码 | 说明1 | 说明2 |
|-|-|-|-|
| 01 | MB01 | Goods receipt for purchase order | 采购订单收货 |
| 02 | MB31 | Goods receipt for production order | 生产订单收货 |
| 03 | MB1A | Goods issue | 发货 |
| 04 | MB1B | Transfer posting | 转储 |
| 05 | MB1C | Other goods receipt | 其他收货 |
| 06 | MB11 | Goods movement | 货物移动 |
| 07 | MB04 | Subsequent adjustment to a subcontract order | 分包后续调整，不懂 |

> 表 ***T158G***，GM_CODE对应的事务代码
>
> 表 ***T158B***，事务代码对应移动类型
>
> 如果不确定要传什么值，可以先到T158B，根据移动类型查找事务代码，再到T158G查找对应GM_CODE
>
> 实在不行，就一个一个试错吧，反正也不多

### MVT_IND

移动标识，大概是针对货物移动（GM_CODE=06）来设置的，参考（域值）说明：

| MVT_IND | 说明1 | 说明2 |
|-|-|-|
| 空 | Goods movement w/o reference | 无参考的货物移动 |
| B | Goods movement for purchase order | 按采购订单的货物移动 |
| F | Goods movement for production order | 有关生产单的货物移动 |
| L | Goods movement for delivery note | 有关交货通知的货物移动 |
| K | Goods movement for kanban requirement (WM - internal only) | 看板需求的货物移动（WM－仅限内部） |
| O | Subsequent adjustment of "material-provided" consumption | "提供物料"消耗的后续调整 |
| W | Subsequent adjustment of proportion/product unit material | 比例的后续调整/产品单位物料 |

### MOVE_TYPE

具体可查表（T156，T156HT），下面列示常见的几种移动类型：

| MOVE_TYPE | 说明 |
|-|-|
| 101 | 收货入库 |
| 102 | 冲销101 |
| 261 | 工单领料 |
| 262 | 工单退料（或冲销261） |
| 311 | 转储 |
| 561 | 创建期初库存 |
| 562 | 冲销561 |

## 场景

### 演示

<details>
<summary>示例代码</summary>

```ABAP

DATA l_mtype TYPE bapi_mtype.
DATA l_msg TYPE bapi_msg.

DATA:
  ls_goodsmvt_header  TYPE bapi2017_gm_head_01,
  ls_goodsmvt_code    TYPE bapi2017_gm_code,
  lt_goodsmvt_item    TYPE STANDARD TABLE OF bapi2017_gm_item_create,
  ls_goodsmvt_item    TYPE bapi2017_gm_item_create,
  ls_goodsmvt_headret TYPE bapi2017_gm_head_ret,
  lt_return           TYPE STANDARD TABLE OF bapiret2,
  ls_return           TYPE bapiret2.

CLEAR ls_goodsmvt_header.
ls_goodsmvt_header-pstng_date = ls_input-budat.
ls_goodsmvt_header-doc_date = ls_input-budat.

CLEAR ls_goodsmvt_code.
ls_goodsmvt_code-gm_code = ls_input-gm_code.

CLEAR lt_goodsmvt_item.
CLEAR ls_goodsmvt_item.
ls_goodsmvt_item-move_type = ls_input-bwart.
ls_goodsmvt_item-material = ls_input-matnr.
ls_goodsmvt_item-plant = ls_input-werks.
ls_goodsmvt_item-stge_loc = ls_input-lgort.
ls_goodsmvt_item-batch = ls_input-charg.
ls_goodsmvt_item-spec_stock = ls_input-sobkz.
ls_goodsmvt_item-entry_qnt = ls_input-menge.
INSERT ls_goodsmvt_item INTO TABLE lt_goodsmvt_item.

CLEAR ls_goodsmvt_headret.
CLEAR lt_return.
CLEAR ls_return.
CALL FUNCTION 'BAPI_GOODSMVT_CREATE'
  EXPORTING
    goodsmvt_header  = ls_goodsmvt_header
    goodsmvt_code    = ls_goodsmvt_code
  IMPORTING
    goodsmvt_headret = ls_goodsmvt_headret
  TABLES
    goodsmvt_item    = lt_goodsmvt_item
    return           = lt_return.
IF ls_goodsmvt_headret-mat_doc IS INITIAL.
  l_mtype = 'E'.
  LOOP AT lt_return INTO ls_return WHERE type CA 'AEX'.
    MESSAGE ID ls_return-id TYPE ls_return-type NUMBER ls_return-number
       WITH ls_return-message_v1 ls_return-message_v2 ls_return-message_v3 ls_return-message_v4
       INTO ls_return-message.
    l_msg = |{ l_msg }{ ls_return-message };|.
  ENDLOOP.
  CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
ELSE.
  l_mtype = 'S'.
  l_msg = |物料凭证{ ls_goodsmvt_headret-mat_doc }已处理|.
  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
    EXPORTING
      wait = 'X'.
ENDIF.

```

</details>

### 采购订单收货

<details>
<summary>示例代码</summary>

```ABAP
```

</details>

### 生产订单收货

<details>
<summary>示例代码</summary>

```ABAP
```

</details>

### 发货

<details>
<summary>示例代码</summary>

```ABAP

DATA:
  ls_goodsmvt_header  TYPE bapi2017_gm_head_01,
  ls_goodsmvt_code    TYPE bapi2017_gm_code,
  ls_goodsmvt_headret TYPE bapi2017_gm_head_ret,
  lt_goodsmvt_item    TYPE STANDARD TABLE OF bapi2017_gm_item_create,
  ls_goodsmvt_item    TYPE bapi2017_gm_item_create,
  lt_return           TYPE STANDARD TABLE OF bapiret2,
  ls_return           TYPE bapiret2.

CLEAR ls_goodsmvt_header.
ls_goodsmvt_header-pstng_date = ls_input-budat.
ls_goodsmvt_header-doc_date = ls_input-budat.

CLEAR ls_goodsmvt_code.
ls_goodsmvt_code-gm_code = '03'. " 发货

CLEAR lt_goodsmvt_item.
CLEAR ls_goodsmvt_item.
ls_goodsmvt_item-material = ls_input-matnr.
ls_goodsmvt_item-plant = ls_input-werks.
ls_goodsmvt_item-stge_loc = ls_input-lgort.
ls_goodsmvt_item-batch = ls_input-charg.
ls_goodsmvt_item-spec_stock = ls_input-sobkz. " 特殊库存标识
ls_goodsmvt_item-entry_qnt = ls_input-menge. " 数量

" 撤销标记
ls_goodsmvt_item-move_type = '261'.
IF ls_input-zcancel IS NOT INITIAL.
  ls_goodsmvt_item-move_type = '262'.
ENDIF.

" WBS元素
IF ls_input-pspnr IS NOT INITIAL.
  ls_goodsmvt_item-wbs_elem = ls_input-pspnr.
ENDIF.

" 生产订单
ls_goodsmvt_item-orderid = ls_input-aufnr.
INSERT ls_goodsmvt_item INTO TABLE lt_goodsmvt_item.

" 预留单
ls_goodsmvt_item-reserv_no = ls_input-rsnum.
ls_goodsmvt_item-res_item = ls_input-rspos.

" 发货过账
CLEAR ls_goodsmvt_headret.
CLEAR lt_return.
CLEAR ls_return.
CALL FUNCTION 'BAPI_GOODSMVT_CREATE'
  EXPORTING
    goodsmvt_header  = ls_goodsmvt_header
    goodsmvt_code    = ls_goodsmvt_code
  IMPORTING
    goodsmvt_headret = ls_goodsmvt_headret
  TABLES
    goodsmvt_item    = lt_goodsmvt_item
    return           = lt_return.
IF ls_goodsmvt_headret-mat_doc IS INITIAL.
  l_mtype = 'E'.
  LOOP AT lt_return INTO ls_return WHERE type CA 'AEX'.
    MESSAGE ID ls_return-id TYPE ls_return-type NUMBER ls_return-number
       WITH ls_return-message_v1 ls_return-message_v2 ls_return-message_v3 ls_return-message_v4
       INTO ls_return-message.
    l_msg = |{ l_msg }{ ls_return-message };|.
  ENDLOOP.
  CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
ELSE.
  l_mtype = 'S'.
  l_msg = |物料凭证{ ls_goodsmvt_headret-mat_doc }已处理|.
  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
    EXPORTING
      wait = 'X'.
ENDIF.

```

</details>

### 转储

对于项目库存(WBS)转储，如果出现项目无法修改的情况，可以在执行前加入下面代码：

<details>
  <summary>设置XMIGO标记</summary>

```ABAP

" 在INCLUDE文件MM07MFU0_UMLAGERUNG_PRUEFEN
" 行179，IF xmigo <> X.
" 行243，IF dm07m-fausw+62(1) = minus.
" 该条件中，WBS_ELEM(PS_PSP_PNR)字段被清空
" 并在后续处理过程，（空值）默认赋值为VAL_WBS_ELEM(MAT_PSPNR)
" 因此，只要干预这两个判断即可解决字段被清空的问题
" 利用下面方法，可以对XMIGO字段进行赋值
CALL FUNCTION 'MB_SET_BAPI_FLAG'
  EXPORTING
    action = 3.

```

</details>

<details>
<summary>示例代码</summary>

```ABAP

DATA:
  ls_goodsmvt_header  TYPE bapi2017_gm_head_01,
  ls_goodsmvt_code    TYPE bapi2017_gm_code,
  ls_goodsmvt_headret TYPE bapi2017_gm_head_ret,
  lt_goodsmvt_item    TYPE STANDARD TABLE OF bapi2017_gm_item_create,
  ls_goodsmvt_item    TYPE bapi2017_gm_item_create,
  lt_return           TYPE STANDARD TABLE OF bapiret2,
  ls_return           TYPE bapiret2.

CLEAR ls_goodsmvt_header.
ls_goodsmvt_header-pstng_date = ls_input-budat.
ls_goodsmvt_header-doc_date = ls_input-budat.

CLEAR ls_goodsmvt_code.
ls_goodsmvt_code-gm_code = '04'. " 转储

CLEAR lt_goodsmvt_item.
CLEAR ls_goodsmvt_item.

ls_goodsmvt_item-material = ls_input-matnr_from.
ls_goodsmvt_item-move_mat = ls_input-matnr_to.

ls_goodsmvt_item-plant      = ls_input-werks_from.
ls_goodsmvt_item-move_plant = ls_input-werks_to.

ls_goodsmvt_item-stge_loc   = ls_input-lgort_from.
ls_goodsmvt_item-move_stloc = ls_input-lgort_to.

ls_goodsmvt_item-batch      = ls_input-charg_from.
ls_goodsmvt_item-move_batch = ls_input-charg_to.

" ls_goodsmvt_item-val_wbs_elem = ls_input-pspnr_from.
" ls_goodsmvt_item-wbs_elem     = ls_input-pspnr_to.

CALL FUNCTION 'CONVERSION_EXIT_ABPSP_OUTPUT'
  EXPORTING
    input  = ls_input-pspnr_from
  IMPORTING
    output = ls_goodsmvt_item-val_wbs_elem.

CALL FUNCTION 'CONVERSION_EXIT_ABPSP_OUTPUT'
  EXPORTING
    input  = ls_input-pspnr_to
  IMPORTING
    output = ls_goodsmvt_item-wbs_elem.

ls_goodsmvt_item-move_type = '311'.
ls_goodsmvt_item-spec_stock = 'Q'. " 特殊库存标识

ls_goodsmvt_item-entry_qnt = ls_input-menge. " 数量

" 设置XMIGO标记
CALL FUNCTION 'MB_SET_BAPI_FLAG'
  EXPORTING
    action = 3.

" 转储过账
CLEAR ls_goodsmvt_headret.
CLEAR lt_return.
CLEAR ls_return.
CALL FUNCTION 'BAPI_GOODSMVT_CREATE'
  EXPORTING
    goodsmvt_header  = ls_goodsmvt_header
    goodsmvt_code    = ls_goodsmvt_code
  IMPORTING
    goodsmvt_headret = ls_goodsmvt_headret
  TABLES
    goodsmvt_item    = lt_goodsmvt_item
    return           = lt_return.
IF ls_goodsmvt_headret-mat_doc IS INITIAL.
  l_mtype = 'E'.
  LOOP AT lt_return INTO ls_return WHERE type CA 'AEX'.
    MESSAGE ID ls_return-id TYPE ls_return-type NUMBER ls_return-number
       WITH ls_return-message_v1 ls_return-message_v2 ls_return-message_v3 ls_return-message_v4
       INTO ls_return-message.
    l_msg = |{ l_msg }{ ls_return-message };|.
  ENDLOOP.
  CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
ELSE.
  l_mtype = 'S'.
  l_msg = |物料凭证{ ls_goodsmvt_headret-mat_doc }已处理|.
  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
    EXPORTING
      wait = 'X'.
ENDIF.

```

</details>

### 其他收货

<details>
<summary>示例代码</summary>

```ABAP
```

</details>

### 货物移动

<details>
<summary>示例代码</summary>

```ABAP
```

</details>

### 销售订单出库

<details>
<summary>示例代码</summary>

```ABAP
```

</details>

## 冲销

BAPI_DELIVERYPROCESSING_EXEC
