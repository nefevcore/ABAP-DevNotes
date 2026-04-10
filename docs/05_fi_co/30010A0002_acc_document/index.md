# 财务凭证

## 过账

***BAPI_ACC_DOCUMENT_CHECK***，测试创建财务凭证

***BAPI_ACC_DOCUMENT_POST***，创建财务凭证

<details>
  <summary>示例代码</summary>

```ABAP
*&---------------------------------------------------------------------*
*& Form frm_post
*&---------------------------------------------------------------------*
*& 创建财务凭证
*&---------------------------------------------------------------------*
FORM frm_post USING i_test TYPE xfeld.

  DATA l_mtype TYPE bapi_mtype.
  DATA l_msg TYPE bapi_msg.

*&---------------------------------------------------------------------*
*& 记账码配置
*&---------------------------------------------------------------------*
  SELECT
    bschl,
    shkzg,
    koart,
    stbsl,
    xsonu
    FROM tbsl
    INTO TABLE @DATA(lt_bschl).
  SORT lt_bschl BY bschl.

*&---------------------------------------------------------------------*
*& BAPI数据声明
*&---------------------------------------------------------------------*
  DATA: ls_documentheader    TYPE bapiache09, "Header
        lt_accountgl         TYPE STANDARD TABLE OF bapiacgl09,
        ls_accountgl         TYPE bapiacgl09, "G/L account item
        lt_accountreceivable TYPE STANDARD TABLE OF bapiacar09,
        ls_accountreceivable TYPE bapiacar09, "Customer Item
        lt_accountpayable    TYPE STANDARD TABLE OF bapiacap09,
        ls_accountpayable    TYPE bapiacap09, "Vendor Item
        lt_currencyamount    TYPE STANDARD TABLE OF bapiaccr09,
        ls_currencyamount    TYPE bapiaccr09, "Currency Items
        lt_criteria          TYPE STANDARD TABLE OF bapiackec9,
        ls_criteria          TYPE bapiackec9, " CO-PA
        lt_extension2        TYPE STANDARD TABLE OF bapiparex,
        ls_extension2        TYPE bapiparex, "Reference Structure for BAPI Parameters EXTENSIONIN/EXTENSIONOUT
        lt_return            TYPE STANDARD TABLE OF bapiret2,
        ls_return            TYPE bapiret2, "Return parameter
        l_obj_key            TYPE bapiache09-obj_key.

  LOOP AT gt_data INTO DATA(ls_data)
    WHERE zsel = 'X' " 取勾选项进行处理
      AND mtype <> 'E' " 校验无误的
      AND belnr = '' " 还没创建的
    GROUP BY (
      bldat = ls_data-bldat
      budat = ls_data-budat
      blart = ls_data-blart
      bukrs = ls_data-bukrs
      monat = ls_data-monat
      waers = ls_data-waers
      xblnr = ls_data-xblnr
      bktxt = ls_data-bktxt
    ) INTO DATA(ls_data_grp).

    CLEAR: ls_documentheader   ,
           lt_accountgl        ,
           ls_accountgl        ,
           lt_accountreceivable,
           ls_accountreceivable,
           lt_accountpayable   ,
           ls_accountpayable   ,
           lt_currencyamount   ,
           ls_currencyamount   ,
           lt_criteria         ,
           ls_criteria         ,
           lt_extension2       ,
           ls_extension2       ,
           lt_return           ,
           ls_return           ,
           l_obj_key           .

    " 任取一行作为抬头
    LOOP AT GROUP ls_data_grp INTO DATA(ls_head). EXIT. ENDLOOP.

    CLEAR ls_documentheader.
    ls_documentheader-comp_code  = ls_head-bukrs. " 公司代码
    ls_documentheader-header_txt = ls_head-bktxt. " 凭证抬头文本
    ls_documentheader-doc_date   = ls_head-bldat. " 凭证日期
    ls_documentheader-pstng_date = ls_head-budat. " 过账日期
    ls_documentheader-doc_type   = ls_head-blart. " 凭证类型
    ls_documentheader-username   = sy-uname. " 用户名
    ls_documentheader-bus_act    = 'RFBU'. " 业务事务
    ls_documentheader-obj_type   = 'BKPFF'. " 参考交易
    ls_documentheader-fis_period = ls_head-monat. " 会计期间
    ls_documentheader-fisc_year  = ls_head-budat+0(4). " 会计年度
    ls_documentheader-ref_doc_no = ls_head-xblnr. " 参考凭证

    " 任取一行作为抬头
    DATA l_itemno_acc TYPE posnr_acc.
    DATA l_gl_acount TYPE hkont.
    CLEAR l_itemno_acc.
    LOOP AT GROUP ls_data_grp INTO ls_data.
      l_itemno_acc = l_itemno_acc + 1.

      READ TABLE lt_bschl INTO DATA(ls_bschl) WITH KEY bschl = ls_data-bschl BINARY SEARCH.
      CASE ls_bschl-koart.
        WHEN 'D'. " 客户
          " 总帐科目
          CLEAR l_gl_acount.
          IF ls_data-hkont IS NOT INITIAL.
            l_gl_acount = ls_data-hkont.
          ELSE.
            SELECT SINGLE akont FROM knb1
              WHERE kunnr = @ls_data-kunnr
                AND bukrs = @ls_data-bukrs
              INTO @l_gl_acount.
            " 特别总账
            IF ls_data-umskz IS NOT INITIAL.
              SELECT SINGLE skont FROM t074
                WHERE ktopl = @l_ktopl
                  AND koart = @ls_bschl-koart
                  AND umskz = @ls_data-umskz
                  AND hkont = @l_gl_acount
                INTO @l_gl_acount.
            ENDIF.
          ENDIF.

          ls_accountreceivable-itemno_acc = l_itemno_acc . " 会计凭证行项目编号
          ls_accountreceivable-gl_account = l_gl_acount. " 总账科目
          ls_accountreceivable-customer   = ls_data-kunnr. " 客户号
          ls_accountreceivable-sp_gl_ind  = ls_data-umskz. " 特殊总账标识
          ls_accountreceivable-tax_code   = ls_data-mwskz. " 税码
          ls_accountreceivable-item_text  = ls_data-sgtxt. " 项目文本
          ls_accountreceivable-alloc_nmbr = ls_data-zuonr. " 分配
          ls_accountreceivable-profit_ctr = ls_data-prctr. " 利润中心
          ls_accountreceivable-pmnttrms   = ls_data-zterm. " 付款条件
          ls_accountreceivable-bline_date = ls_data-zfbdt. " 付款起算日期
          ls_accountreceivable-bus_area   = ls_data-gsber. " 业务范围
          INSERT ls_accountreceivable INTO TABLE lt_accountreceivable.

        WHEN 'K'. " 供应商
          " 总帐科目
          CLEAR l_gl_acount.
          IF ls_data-hkont IS NOT INITIAL.
            l_gl_acount = ls_data-hkont.
          ELSE.
            SELECT SINGLE akont FROM lfb1
              WHERE lifnr = @ls_data-lifnr
                AND bukrs = @ls_data-bukrs
              INTO @l_gl_acount.
            " 特别总账
            IF ls_data-umskz IS NOT INITIAL.
              SELECT SINGLE skont FROM t074
                WHERE ktopl = @l_ktopl
                  AND koart = @ls_bschl-koart
                  AND umskz = @ls_data-umskz
                  AND hkont = @l_gl_acount
                INTO @l_gl_acount.
            ENDIF.
          ENDIF.

          ls_accountpayable-itemno_acc = l_itemno_acc. " 会计凭证行项目编号
          ls_accountpayable-gl_account = l_gl_acount. " 总账科目
          ls_accountpayable-item_text  = ls_data-sgtxt. " 项目文本
          ls_accountpayable-vendor_no  = ls_data-lifnr. " 供应商编号
          ls_accountpayable-sp_gl_ind  = ls_data-umskz. " 特殊总账标识
          ls_accountpayable-alloc_nmbr = ls_data-zuonr. " 分配
          ls_accountpayable-profit_ctr = ls_data-prctr. " 利润中心
          ls_accountpayable-tax_code = ls_data-mwskz. " 税码
          ls_accountpayable-pmnttrms = ls_data-zterm. " 付款条件
          ls_accountpayable-bline_date = ls_data-zfbdt. " 付款起算日期
          ls_accountpayable-bus_area   = ls_data-gsber. " 业务范围
          INSERT ls_accountpayable INTO TABLE lt_accountpayable.

        WHEN 'S'. " 总分类帐科目
          l_gl_acount = ls_data-hkont.

          ls_accountgl-itemno_acc = l_itemno_acc. " 会计凭证行项目编号
          ls_accountgl-item_text  = ls_data-sgtxt. " 项目文本
          ls_accountgl-gl_account = l_gl_acount. " 总分类帐帐目
          ls_accountgl-costcenter = ls_data-kostl. " 成本中心
          ls_accountgl-alloc_nmbr = ls_data-zuonr. " 分配编号
          ls_accountgl-orderid    = ls_data-aufnr. " 内部订单号
          ls_accountgl-tax_code   = ls_data-mwskz. " 税号
          ls_accountgl-po_number  = ls_data-ebeln. " 采购凭证号
          ls_accountgl-po_item    = ls_data-ebelp. " 采购凭证行项目号
          ls_accountgl-profit_ctr = ls_data-prctr. " 利润中心
          ls_accountgl-material_long = ls_data-matnr. " 物料
          INSERT ls_accountgl INTO TABLE lt_accountgl.

        WHEN 'A'. " 资产
          " 资产统御科目
          CLEAR l_gl_acount.
          IF ls_data-hkont IS NOT INITIAL.
            l_gl_acount = ls_data-hkont.
          ELSE.
            SELECT SINGLE ktogr FROM anla
              WHERE bukrs = @ls_data-bukrs
                AND anln1 = @ls_data-anln1
              INTO @l_gl_acount.
            IF sy-subrc = 0.
              SELECT SINGLE ktansw FROM t095
                WHERE ktopl = @l_ktopl
                  AND ktogr = @l_gl_acount
                INTO @l_gl_acount.
            ENDIF.
          ENDIF.

          ls_accountgl-itemno_acc = l_itemno_acc. " 会计凭证行项目编号
          ls_accountgl-item_text  = ls_data-sgtxt. " 项目文本
          ls_accountgl-gl_account = l_gl_acount. " 统御科目
          ls_accountgl-acct_type  = ls_bschl-koart. " 业务类型
          ls_accountgl-asset_no   = ls_data-anln1. " 主资产号
          ls_accountgl-sub_number = '0000'. "次资产号
          ls_accountgl-costcenter = ls_data-kostl. " 成本中心
          ls_accountgl-alloc_nmbr = ls_data-zuonr. " 分配编号
          ls_accountgl-orderid    = ls_data-aufnr. " 内部订单号
          ls_accountgl-tax_code   = ls_data-mwskz. " 税号
          ls_accountgl-po_number  = ls_data-ebeln. " 采购凭证号
          ls_accountgl-po_item    = ls_data-ebelp. " 采购凭证行项目号
          ls_accountgl-profit_ctr = ls_data-prctr. " 利润中心
          ls_accountgl-material_long = ls_data-matnr. " 物料
          ls_accountgl-bus_area   = ls_data-gsber. " 业务范围
          INSERT ls_accountgl INTO TABLE lt_accountgl.
          
        WHEN 'M'. " 物料

        WHEN OTHERS.
      ENDCASE.

      " 货币项目
      ls_currencyamount-itemno_acc = l_itemno_acc. "行项目编号
      IF ls_bschl-shkzg = 'S'.
        ls_currencyamount-amt_doccur = ls_data-wrbtr. " 金额
        ls_currencyamount-tax_amt = ls_data-xmwst. " 税额
      ELSE.
        ls_currencyamount-amt_doccur  = ls_data-wrbtr * -1. " 金额
        ls_currencyamount-tax_amt = ls_data-xmwst * -1. " 税额
      ENDIF.
      ls_currencyamount-currency = ls_head-waers.  "货币
      INSERT ls_currencyamount INTO TABLE lt_currencyamount.

      " 增强字段
      DATA ls_ext TYPE zsfi0001.
      ls_ext-posnr = l_itemno_acc.  " 会计凭证行项目编号
      ls_ext-bschl = ls_data-bschl. " 记帐代码
      ls_ext-rstgr = ls_data-rstgr. " 付款原因代码

      CLEAR ls_extension2.
      ls_extension2-structure = 'ZSFI0001'.
      MOVE ls_ext TO ls_extension2+30.
      INSERT ls_extension2 INTO TABLE lt_extension2.
    ENDLOOP.

    IF i_test = 'X'.
      CALL FUNCTION 'BAPI_ACC_DOCUMENT_CHECK'
        EXPORTING
          documentheader    = ls_documentheader
        TABLES
          accountgl         = lt_accountgl
          accountreceivable = lt_accountreceivable
          accountpayable    = lt_accountpayable
          currencyamount    = lt_currencyamount
          criteria          = lt_criteria
          return            = lt_return
          extension2        = lt_extension2.
    ELSE.
      CALL FUNCTION 'BAPI_ACC_DOCUMENT_POST'
        EXPORTING
          documentheader    = ls_documentheader
        IMPORTING
          obj_key           = l_obj_key
        TABLES
          accountgl         = lt_accountgl
          accountreceivable = lt_accountreceivable
          accountpayable    = lt_accountpayable
          currencyamount    = lt_currencyamount
          criteria          = lt_criteria
          return            = lt_return
          extension2        = lt_extension2.
    ENDIF.

    " 整理BAPI消息
    CLEAR l_msg.
    LOOP AT lt_return INTO ls_return WHERE type CA 'AEX'.
      MESSAGE ID ls_return-id TYPE ls_return-type NUMBER ls_return-number
         WITH ls_return-message_v1 ls_return-message_v2 ls_return-message_v3 ls_return-message_v4
         INTO ls_return-message.
      l_mtype = 'E'.
      l_msg = |{ l_msg }{ ls_return-message };|.
    ENDLOOP.
    IF sy-subrc <> 0.
      l_mtype = 'S'.
      IF i_test = 'X'.
        l_msg = |测试运行成功|.
      ELSE.
        l_msg = |会计凭证{ l_obj_key(10) }已处理|.
      ENDIF.
    ENDIF.

    " 回写报表
    LOOP AT GROUP ls_data_grp REFERENCE INTO DATA(lr_data).
      lr_data->mtype = l_mtype.
      lr_data->msg = l_msg.
      lr_data->belnr = l_obj_key(10).
    ENDLOOP.

    IF i_test = 'X'.
      " 测试运行结束
      CONTINUE.
    ELSE.
      " 提交数据库
      IF l_mtype = 'E'.
        CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
      ELSE.
        CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
          EXPORTING
            wait = 'X'.
      ENDIF.
    ENDIF.

  ENDLOOP. " LOOP AT gt_data GROUP BY

ENDFORM.

```

</details>

## 增强

BAPI的EXTENSION2增强代码差异不大，对于上面BAPI来说，需要在ACC_DOCUMENT(BADI)增强，IF_EX_ACC_DOCUMENT~CHANGE方法中加入下面代码。

<details>
  <summary>示例代码</summary>

```ABAP

***********************************************************************
* Example to move fields from BAPI parameter EXTENSION2 to structure  *
* ACCIT (accounting document line items).                             *
* The dictionary structure (content for EXTENSION2-STRUCTURE) must    *
* contain field POSNR, (TYPE POSNR_ACC) to indentify the correct line *
* item of the internal table ACCIT.                                   *
***********************************************************************

  DATA: wa_extension   TYPE bapiparex,
        ext_value(960) TYPE c,
        wa_accit       TYPE accit,
        l_ref          TYPE REF TO data.

  FIELD-SYMBOLS: <l_struc> TYPE ANY,
                 <l_field> TYPE ANY.

  SORT c_extension2 BY structure.

  LOOP AT c_extension2 INTO wa_extension.
    AT NEW structure.
      CREATE DATA l_ref TYPE (wa_extension-structure).
      ASSIGN l_ref->* TO <l_struc>.
    ENDAT.
    CONCATENATE wa_extension-valuepart1 wa_extension-valuepart2
                wa_extension-valuepart3 wa_extension-valuepart4
           INTO ext_value.
    MOVE ext_value TO <l_struc>.
    ASSIGN COMPONENT 'POSNR' OF STRUCTURE <l_struc> TO <l_field>.
    READ TABLE c_accit WITH KEY posnr = <l_field>
          INTO wa_accit.
    IF sy-subrc IS INITIAL.
      MOVE-CORRESPONDING <l_struc> TO wa_accit.
      MODIFY c_accit FROM wa_accit INDEX sy-tabix.
    ENDIF.
  ENDLOOP.

```

</details>
