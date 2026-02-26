# 销售屏幕增强

屏幕出口有两种，标准出口，和BADI增强，推荐后者，更为灵活

## 标准屏幕出口

SAPMV45A程序，屏幕8309（抬头）、8459（行项目）是标准预留的出口屏幕，在其中加入PAI、PBO逻辑即可。

## BADI增强

SE18进入增强点 ***BADI_SD_SALES_BASIC***

### 实施 ***BADI_SLS_HEAD_SCR_CUS***

<details>
  <summary>IF_EX_SLS_HEAD_SCR_CUS~ACTIVATE_TAB_PAGE 激活抬头页签</summary>

```ABAP

  DATA ls_tab LIKE LINE OF ct_cus_head_tab.

  IF sy-tcode CP 'VA++' or sy-tcode CP 'MD++'.
    CLEAR ls_tab.
    ls_tab-head_caption = '销售附加数据'. " 页签名称
    ls_tab-head_program = 'SAPLZFG_SD_SCREEN '. " 自定义的程序，推荐使用函数组，方便后续参数处理
    ls_tab-head_dynpro  = '9001'. " 屏幕
    APPEND ls_tab TO ct_cus_head_tab.
  ENDIF.

```

</details>

<details>
  <summary>IF_EX_SLS_HEAD_SCR_CUS~TRANSFER_DATA_TO_SUBSCREEN 抬头数据传入</summary>

```ABAP

  " 按项目需求，将需要的参数传到屏幕中使用
  " 另外发现很多人会忽略T180，该参数实际可用于屏幕控制（T180-TRTYP），可用该参数替代许多事务代码的IF

```

</details>

<details>
  <summary>IF_EX_SLS_HEAD_SCR_CUS~TRANSFER_DATA_FROM_SUBSCREEN 抬头数据传出</summary>

```ABAP

  " 与传入相反的操作，将增强字段的值回写标准表中

```

</details>

### 实施 ***BADI_SLS_ITEM_SCR_CUS***

<details>
  <summary>IF_EX_SLS_ITEM_SCR_CUS~ACTIVATE_TAB_PAGE 激活行项目页签</summary>

```ABAP

  DATA ls_tab LIKE LINE OF ct_cus_item_tab.

  IF sy-tcode CP 'VA++' or sy-tcode CP 'MD++'.
    CLEAR ls_tab.
    ls_tab-item_caption = '销售附加数据'. " 页签名称
    ls_tab-item_program = 'SAPLZFG_SD_SCREEN '. " 自定义的程序，推荐使用函数组，方便后续参数处理
    ls_tab-item_dynpro  = '9002'. " 屏幕
    APPEND ls_tab TO ct_cus_item_tab.
  ENDIF.

```

</details>

<details>
  <summary>IF_EX_SLS_ITEM_SCR_CUS~TRANSFER_DATA_TO_SUBSCREEN 行项目数据传入</summary>

```ABAP

  " 按项目需求，将需要的参数传到屏幕中使用
  " 另外发现很多人会忽略T180，该参数实际可用于屏幕控制（T180-TRTYP），可用该参数替代许多事务代码的IF

```

</details>

<details>
  <summary>IF_EX_SLS_HEAD_SCR_CUS~TRANSFER_DATA_FROM_SUBSCREEN 行项目数据传出</summary>

```ABAP

  " 与传入相反的操作，将增强字段的值回写标准表中
  " 需要注意，标准无法处理客制屏幕上的命令（比如按钮）
  " 只需要将CV_FCODE修改为标准命令即可，如ENT1

```

</details>
