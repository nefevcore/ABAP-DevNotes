# 贸易合同

注意，如果是合同参考创建的订单，通常会要求通过工作台处理，这时需要在业务执行前加入以下代码：

<details>
  <summary>示例代码</summary>

```ABAP

CALL FUNCTION 'WB2_RESET_EXTERNAL_DATA' .

CALL FUNCTION 'WB2_CHECK_TEW_ACTIVE'
  EXCEPTIONS
    not_active = 1
    OTHERS     = 2.

DATA l_tew_type TYPE wb2_tew_type.
CALL FUNCTION 'WB2_TRADE_GET_INIT_DATA'
  IMPORTING
    e_tew_type = l_tew_type.

CALL FUNCTION 'WB2_TEW_ACTION_SET_PARAMETER'
  EXPORTING
    i_tew_type    = i_tew_type
    i_step        = i_step
    i_mode        = i_mode
    i_pre_step    = i_pre_step
    i_catt_active = 'X'.

```

</details>

## WTEW配置

> SPRO\后勤\全球贸易管理

## 贸易合同创建与修改

通常，流程首先创建购销合同，然后再参考该合同，创建后续的采购合同和销售合同。这三种合同按合同类型加以区分，可由业务配置。

***BAPI_TRADINGCONTRACT_CREATE***：创建贸易合同

***BAPI_TRADINGCONTRACT_CHANGE***：修改贸易合同

***WB2_DELETE_TRADING_CONT_ALL***：合同批量删除

<details>
  <summary>示例代码</summary>

```ABAP

*----------------------------------------------------------------------*
***INCLUDE LZGTM001P01.
*----------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*& Class (Implementation) lcl_wb2_ctr_data
*&---------------------------------------------------------------------*
*&
*&---------------------------------------------------------------------*
CLASS lcl_wb2_ctr_data IMPLEMENTATION.

  METHOD read.

    IF contract_id IS SUPPLIED AND m_contract <> contract_id.
      m_contract = contract_id.
      mo_instance = NEW #( ).

      DATA l_tkonn TYPE komwbhk-tkonn.
      DATA ls_t180 TYPE t180.
      l_tkonn = contract_id.
      ls_t180 = VALUE #( trtyp = 'A' ).

      CALL FUNCTION 'WB2_CONTRACT_READ'
        EXPORTING
          i_tkonn                = l_tkonn
          i_t180                 = ls_t180
        IMPORTING
          e_komwbhk              = mo_instance->ms_komwbhk
        TABLES
          t_komwbhk              = mo_instance->mt_komwbhk
          t_komwbhi              = mo_instance->mt_komwbhi
          t_komwbhd              = mo_instance->mt_komwbhd
          t_komwbhe              = mo_instance->mt_komwbhe
          t_komwbhp              = mo_instance->mt_komwbhp
        EXCEPTIONS
          application_data_error = 1
          lock_error             = 2
          customizing_error      = 3
          OTHERS                 = 4.
      IF sy-subrc <> 0.
* Implement suitable error handling here
      ENDIF.
    ENDIF.

    " 至少保证不dump
    IF mo_instance IS NOT BOUND.
      mo_instance = NEW #( ).
    ENDIF.

    result = mo_instance.

  ENDMETHOD.

  METHOD get_fiori_head     .

    " 抬头
    result-tkonn                = ms_komwbhk-tkonn          .
    result-tkonn_ex             = ms_komwbhk-tkonn_ex       .
    result-tew_type             = ms_komwbhk-tew_type       .
    result-zframe_tkonn         = ms_komwbhk-zframe_tkonn   .
    result-zzsign_platfrom      = ms_komwbhk-vkorg          .
    result-vtweg                = ms_komwbhk-vtweg          .
    result-spart                = ms_komwbhk-spart          .
    result-zzsndat              = ms_komwbhk-zzsndat        .
    result-btbsta               = ms_komwbhk-btbsta         .
    result-zprictp              = ms_komwbhk-zprictp        .
    result-zzlsch_mm            = ms_komwbhk-zzlsch_mm      .
    result-zzlsch_mm_ex         = ms_komwbhk-zzlsch_txt_mm_n.
    result-zzlsch_sd            = ms_komwbhk-zzlsch_sd      .
    result-zzlsch_sd_ex         = ms_komwbhk-zzlsch_txt_sd_n.
    result-zzrpdate_end         = ms_komwbhk-zzrpdate_end   .
    result-zzamt01_mm           = ms_komwbhk-zzamt01_mm     .
    result-zzcur01_mm           = ms_komwbhk-zzcur01_mm     .
    result-zzpcode_src          = ms_komwbhk-zzpcode_src    .
    result-zzland1_src          = ms_komwbhk-zzland1_src    .
    result-zzpname_src          = ms_komwbhk-zzpname_src    .
    result-zzpcode_des          = ms_komwbhk-zzpcode_des    .
    result-zzland1_des          = ms_komwbhk-zzland1_des    .
    result-zzpname_des          = ms_komwbhk-zzpname_des    .
    result-zzpcode_tra          = ms_komwbhk-zzpcode_tra    .
    result-zzland1_tra          = ms_komwbhk-zzland1_tra    .
    result-zzpname_tra          = ms_komwbhk-zzpname_tra    .
    result-zzis_preins          = ms_komwbhk-zzis_preins    .
    result-zzreceived_data_last = |{ ms_komwbhk-zzzcdh_date DATE = RAW }|.
    result-zzlaycan_from        = ms_komwbhk-zzlaycanq      .
    result-zzlaycan_to          = ms_komwbhk-zzlaycanz      .
    result-tctyp                = ms_komwbhk-tctyp          .
    result-zzbusst              = ms_komwbhk-zzbusst        .
    result-zzsnfile             = ms_komwbhk-zzsnfile       .
    result-zzsnflg              = ms_komwbhk-zzsnflg        .
    result-zzwd_tcdoc_flg       = ms_komwbhk-zzwd_tcdoc_flg .
    result-zzyqd                = ms_komwbhk-zzyqd          .
    result-zzstpga_flg          = ms_komwbhk-zzstpga_flg    .
    result-zzgmyw_flg           = ms_komwbhk-zzgmyw_flg     .
    result-zzflexible           = ms_komwbhk-zzflexible     .
    result-zzwtcgp              = ms_komwbhk-zzwtcgp        .
    result-zzwtcgp_rt           = ms_komwbhk-zzwtcgp_rt     .
    result-guarantee_f          = ms_komwbhk-guarantee_f    .
    result-ciq_lastdt           = ms_komwbhk-ciq_lastdt     .
    result-consnno              = ms_komwbhk-consnno        .
    result-remark1_p            = ms_komwbhk-remark1_p      .
    result-remark2_p            = ms_komwbhk-remark2_p      .
    result-remark3_p            = ms_komwbhk-remark3_p      .
    result-zzwtc_fvdate         = ms_komwbhk-zzwtc_fvdate   .
    result-zzwtc_fvtime         = ms_komwbhk-zzwtc_fvtime   .
    result-zzwtc_fvapper        = ms_komwbhk-zzwtc_fvapper  .
    result-zzefeupt_date        = ms_komwbhk-zzefeupt_date  .
    result-zzpreclo_date        = ms_komwbhk-zzpreclo_date  .
    result-zznatclo_date        = ms_komwbhk-zznatclo_date  .

    " 抬头2
    LOOP AT mt_komwbhd REFERENCE INTO DATA(lr_komwbhd).
      result-bstkd       = lr_komwbhd->bstkd        .
      result-waers       = lr_komwbhd->waers_purch  .
      result-tkrate_mm   = lr_komwbhd->tkrate_mm    .
      result-kurst_mm    = lr_komwbhd->kurst_mm     .
      result-ekorg       = lr_komwbhd->ekorg        .
      result-ekgrp       = lr_komwbhd->ekgrp        .
      result-inco1_mm    = lr_komwbhd->inco1_mm     .
      result-inco1_mm_ex = lr_komwbhd->inco2_l_mm   .
      result-inco1_sd    = lr_komwbhd->inco1_sd     .
      result-inco1_sd_ex = lr_komwbhd->inco2_l_sd   .
      result-zterm       = lr_komwbhd->zterm        .
      result-zzshipping_data_last = lr_komwbhd->edatu_vbak.
      result-zzreceived_data_last = lr_komwbhd->eindt  .
      EXIT.
    ENDLOOP.

    " 抬头金额汇总
    LOOP AT mt_komwbhi REFERENCE INTO DATA(lr_komwbhi).
      result-zamount_sum   = result-zamount_sum + lr_komwbhi->netpr_mm * lr_komwbhi->menge.
      result-zcurrency_sum = lr_komwbhi->waers_mm.
    ENDLOOP.

    " 抬头3
    LOOP AT mt_komwbhp REFERENCE INTO DATA(lr_komwbhp).
      CASE lr_komwbhp->parvw.
        WHEN 'LF' OR 'VN'.
          result-lifnr = lr_komwbhp->lifnr.
        WHEN 'RS' OR 'PI'.
        WHEN 'Z4'.
          result-lifnr2 = lr_komwbhp->lifnr.
        WHEN 'Z1'.
          result-lifnr3 = lr_komwbhp->lifnr.
        WHEN 'ER' OR 'ZM'.
          result-lifnr4 = lr_komwbhp->lifnr.
        WHEN 'SP' OR 'AG'.
        WHEN 'WE' OR 'SH'.
        WHEN OTHERS.
      ENDCASE.
    ENDLOOP.

  ENDMETHOD.

  METHOD get_fiori_partner  .

    DATA ls_partner LIKE LINE OF result.

    LOOP AT mt_komwbhp REFERENCE INTO DATA(lr_komwbhp).
      CLEAR ls_partner.
      ls_partner-tkonn     = lr_komwbhp->tkonn    .
      ls_partner-tposn     = lr_komwbhp->tposn    .
      ls_partner-tposn_sub = lr_komwbhp->tposn_sub.
      ls_partner-parvw     = lr_komwbhp->parvw    .
      ls_partner-lifnr     = lr_komwbhp->lifnr    .
      ls_partner-kunnr     = lr_komwbhp->kunnr    .
      ls_partner-adrnr     = lr_komwbhp->adrnr    .
      ls_partner-land      = lr_komwbhp->land     .
      ls_partner-pstlz     = lr_komwbhp->pstlz    .
      ls_partner-regio     = lr_komwbhp->regio    .
      ls_partner-ort01     = lr_komwbhp->ort01    .
      ls_partner-name1     = lr_komwbhp->name1    .
      INSERT ls_partner INTO TABLE result.
    ENDLOOP.

  ENDMETHOD.

  METHOD get_fiori_item     .

    DATA ls_item LIKE LINE OF result.

    LOOP AT mt_komwbhi REFERENCE INTO DATA(lr_komwbhi).
      CLEAR ls_item.
      ls_item-tkonn        = lr_komwbhi->tkonn    .
      ls_item-tposn        = lr_komwbhi->tposn    .
      ls_item-tposn_sub    = lr_komwbhi->tposn_sub.
      ls_item-matnr        = lr_komwbhi->matnr    .
      ls_item-arktx        = lr_komwbhi->arktx    .
      ls_item-menge        = lr_komwbhi->menge    .
      ls_item-meins        = lr_komwbhi->meins    .
      ls_item-uebto_mm     = lr_komwbhi->uebto_mm .
      ls_item-untto_mm     = lr_komwbhi->untto_mm .
      ls_item-netpr_mm     = lr_komwbhi->netpr_mm .
      ls_item-peinh_mm     = lr_komwbhi->peinh_mm .
      ls_item-waers_mm     = lr_komwbhi->waers_mm .
      ls_item-zzsubtotal   = ls_item-netpr_mm * ls_item-menge.
*      ls_item-zzunit_price = lr_komwbhi->zzunit_price.
      ls_item-lgort        = lr_komwbhi->lgort       .
      ls_item-zpcmark      = lr_komwbhi->zpcmark     .

      " 特性取值
      DATA allocvaluesnum   TYPE STANDARD TABLE OF bapi1003_alloc_values_num.
      DATA allocvalueschar  TYPE STANDARD TABLE OF bapi1003_alloc_values_char.
      DATA allocvaluescurr  TYPE STANDARD TABLE OF bapi1003_alloc_values_curr.
      DATA return           TYPE STANDARD TABLE OF bapiret2.

      CLEAR allocvaluesnum.
      CLEAR allocvalueschar.
      CLEAR allocvaluescurr.
      CLEAR return.

      CALL FUNCTION 'BAPI_OBJCL_GETDETAIL'
        EXPORTING
          objectkey       = CONV bapi1003_key-object( ls_item-matnr )
          objecttable     = 'MARA'
          classnum        = 'C_01'
          classtype       = '023'
        TABLES
          allocvaluesnum  = allocvaluesnum
          allocvalueschar = allocvalueschar
          allocvaluescurr = allocvaluescurr
          return          = return.

      LOOP AT allocvalueschar REFERENCE INTO DATA(lr_allocvalueschar).
        CASE lr_allocvalueschar->charact.
          WHEN 'B_0001'. " 预算号
          WHEN 'B_0002'. " 外部合同号
          WHEN 'B_0003'. " 采购订单号
          WHEN 'B_0004'. " 采购订单类型
          WHEN 'B_0005'. " 业务形式
          WHEN 'B_0006'. " 采购组
          WHEN 'B_0007'. " 业务员
          WHEN 'B_0008'. " 入库时间
          WHEN 'B_0009'. " 规格属性1
          WHEN 'B_0010'. " 规格属性2
          WHEN 'B_0011'. " 产品种类/材质
            ls_item-zprdcat = lr_allocvalueschar->value_char.
          WHEN 'B_0012'. " 商品等级
            ls_item-zoland = lr_allocvalueschar->value_char.
          WHEN 'B_0013'. " 厂家/品牌
            ls_item-zfactory = lr_allocvalueschar->value_char.
          WHEN 'B_0014'. " 工艺/技术标准
            ls_item-ztechstd = lr_allocvalueschar->value_char.
          WHEN 'B_0015'. " 型号/等级
            ls_item-zprdcat = lr_allocvalueschar->value_char.
          WHEN 'B_0016'. " 备注
          WHEN 'B_0018'. " 尺寸/包装
            ls_item-zccbz = lr_allocvalueschar->value_char.
          WHEN 'B_0019'. " 运输载具号
            ls_item-zyszjh = lr_allocvalueschar->value_char.
          WHEN 'B_0020'. " 运输方式
          WHEN 'B_0021'. " 采购订单行项目
          WHEN 'B_0030'. " 第二计量单位
          WHEN 'B_0031'. " 第二单位转换系数
          WHEN 'B_0032'. " 第二单位可变参数
          WHEN 'B_0017'. " 原产地
          WHEN 'B_0022'. " 性能/用途
          WHEN 'B_0023'. " 运输单据号
            ls_item-zysdjh = lr_allocvalueschar->value_char.
          WHEN 'B_0024'. " 报关单号
            ls_item-zbgdh = lr_allocvalueschar->value_char.
          WHEN 'B_0025'. " 库位（区）号
            ls_item-zkwh = lr_allocvalueschar->value_char.
          WHEN 'B_0026'. " 生产日期
            ls_item-zscrq = lr_allocvalueschar->value_char.
          WHEN 'B_0027'. " 自定义属性1
            ls_item-zzdysx1 = lr_allocvalueschar->value_char.
          WHEN 'B_0028'. " 自定义属性2
            ls_item-zzdysx2 = lr_allocvalueschar->value_char.
          WHEN 'B_0029'. " 自定义属性3
            ls_item-zzdysx3 = lr_allocvalueschar->value_char.
          WHEN OTHERS.
        ENDCASE.
      ENDLOOP.

      INSERT ls_item INTO TABLE result.
    ENDLOOP.

  ENDMETHOD.

  METHOD get_fiori_condition.

    DATA ls_condition LIKE LINE OF result.

    " 定价
    DATA(lt_komwbhd) = mt_komwbhd.
    IF ms_komwbhk-knumv_sd IS NOT INITIAL.
      INSERT VALUE #( knumv_mm = ms_komwbhk-knumv_sd ) INTO TABLE lt_komwbhd.
    ENDIF.

    LOOP AT lt_komwbhd REFERENCE INTO DATA(lr_komwbhd).
      SELECT SINGLE
        knumv       ,
        kposn       ,
        stunr       ,
        zaehk       ,
        kschl       ,
        kbetr       ,
        waers       ,
        kpein       ,
        kmein       ,
        kwert
        FROM prcd_elements
        WHERE knumv = @lr_komwbhd->knumv_mm
        INTO @DATA(ls_prcd_elements).
      IF sy-subrc <> 0.
        CONTINUE.
      ENDIF.

      CLEAR ls_condition.
      ls_condition-tkonn        = lr_komwbhd->tkonn            .
      ls_condition-tposn        = lr_komwbhd->tposn            .
      ls_condition-tposn_sub    = lr_komwbhd->tposn_sub        .
      ls_condition-knumv        = ls_prcd_elements-knumv       .
      ls_condition-kposn        = ls_prcd_elements-kposn       .
      ls_condition-stunr        = ls_prcd_elements-stunr       .
      ls_condition-zaehk        = ls_prcd_elements-zaehk       .
      ls_condition-kschl        = ls_prcd_elements-kschl       .
*      LS_CONDITION-kschl_text   = ls_prcd_elements-kschl_text  .
*      LS_CONDITION-zzto_cost    = ls_prcd_elements-zzto_cost   .
      ls_condition-kbetr        = ls_prcd_elements-kbetr       .
      ls_condition-waers        = ls_prcd_elements-waers       .
      ls_condition-kpein        = ls_prcd_elements-kpein       .
      ls_condition-kmein        = ls_prcd_elements-kmein       .
*      LS_CONDITION-zzconvertion = ls_prcd_elements-zzconvertion.
      ls_condition-kwert        = ls_prcd_elements-kwert       .
      INSERT ls_condition INTO TABLE result.
    ENDLOOP.

  ENDMETHOD.

  METHOD get_fiori_related  . ENDMETHOD.
  METHOD get_fiori_text     . ENDMETHOD.

ENDCLASS.

*&---------------------------------------------------------------------*
*& Class (Implementation) lcl_fiori_ctr_data
*&---------------------------------------------------------------------*
*&
*&---------------------------------------------------------------------*
CLASS lcl_fiori_ctr_data IMPLEMENTATION.

  METHOD read.

    IF contract_id IS SUPPLIED AND m_contract <> contract_id.
      m_contract = contract_id.
      mo_instance = NEW #( ).

      DATA(lo_wb2_ctr_data) = lcl_wb2_ctr_data=>read( m_contract ).
      mo_instance->ms_head      = lo_wb2_ctr_data->get_fiori_head( ).
      mo_instance->mt_partner   = lo_wb2_ctr_data->get_fiori_partner( ).
      mo_instance->mt_item      = lo_wb2_ctr_data->get_fiori_item( ).
      mo_instance->mt_condition = lo_wb2_ctr_data->get_fiori_condition( ).
      mo_instance->mt_related   = lo_wb2_ctr_data->get_fiori_related( ).
      mo_instance->mt_text      = lo_wb2_ctr_data->get_fiori_text( ).
      mo_instance->mt_payment   = mo_instance->read_payment( ).
    ENDIF.

    " 至少保证不dump
    IF mo_instance IS NOT BOUND.
      mo_instance = NEW #( ).
    ENDIF.

    result = mo_instance.

  ENDMETHOD.

  METHOD save_payment.

    DATA lt_zttcpt TYPE STANDARD TABLE OF zttcpt WITH EMPTY KEY.
    DATA ls_zttcpt TYPE zttcpt.

    LOOP AT mt_payment REFERENCE INTO DATA(lr_payment).
      CLEAR ls_zttcpt.
      ls_zttcpt-tkonn         = m_contract.
      ls_zttcpt-zzxh          = sy-tabix.
      ls_zttcpt-zzfktj        = lr_payment->zzterm.
      ls_zttcpt-zzsfkrq       = lr_payment->zzdate_last.
      ls_zttcpt-zzysfkje      = lr_payment->zzamount.
      ls_zttcpt-zwaers_purch  = lr_payment->zzcurrency.
      ls_zttcpt-zzsfk_remark  = lr_payment->zzpay_ex.
      INSERT ls_zttcpt INTO TABLE lt_zttcpt.
    ENDLOOP.

    DELETE FROM zttcpt WHERE tkonn = ms_head-tkonn.
    MODIFY zttcpt FROM TABLE lt_zttcpt.
    COMMIT WORK AND WAIT.

  ENDMETHOD.

  METHOD read_payment.

    DATA(l_tkonn) = contract_id.
    IF contract_id IS NOT SUPPLIED.
      l_tkonn = ms_head-tkonn.
    ENDIF.

    SELECT
      tkonn,
      zzxh,
      zzfktj AS zzterm,
      CAST( zzsfkrq AS CHAR( 10 ) ) AS zzdate_last,
      zzysfkje AS zzamount,
      zwaers_purch AS zzcurrency,
      zzsfk_remark AS zzpay_ex
      FROM zttcpt
      WHERE tkonn = @l_tkonn
        INTO CORRESPONDING FIELDS OF TABLE @mt_payment.
    result = mt_payment.

  ENDMETHOD.

ENDCLASS.

*&---------------------------------------------------------------------*
*& Class (Implementation) lcl_bapi_ctr_create
*&---------------------------------------------------------------------*
*&
*&---------------------------------------------------------------------*
CLASS lcl_bapi_ctr_create IMPLEMENTATION.

  METHOD lif_bapi~execute.
    result = me.

    " 增强字段长度大于960，无法使用extensionin字段
    " 因此通过BAPI增强的方式，将值传入
    " 由于是静态参数，等价于内存传值，而且更好的溯源
    zcl_im__wb2_bapi_enhance_ex=>set_extension(
      EXPORTING
        bapi_te_wbhk    = ms_bapi_te_wbhk
        t_bapi_te_wbhi  = mt_bapi_te_wbhi
        t_bapi_te_wbhd  = mt_bapi_te_wbhd
        t_bapi_te_wbhe  = mt_bapi_te_wbhe
        t_bapi_te_wbhp  = mt_bapi_te_wbhp
        bapi_te_wbhkx   = ms_bapi_te_wbhkx
        t_bapi_te_wbhix = mt_bapi_te_wbhix
        t_bapi_te_wbhdx = mt_bapi_te_wbhdx
        t_bapi_te_wbhex = mt_bapi_te_wbhex
        t_bapi_te_wbhpx = mt_bapi_te_wbhpx
    ).

    headdatain-testrun = testrun.
    SET PARAMETER ID 'BAPIHT' FIELD 'X'." BAPI创建合同，用于跳过部分校验
    CALL FUNCTION 'BAPI_TRADINGCONTRACT_CREATE'
      EXPORTING
        headdatain           = headdatain
      IMPORTING
        headdataout          = headdataout
        tradingcontractno    = tradingcontractno
      TABLES
        itemdatain           = itemdatain
        scheduledatain       = scheduledatain
        businessdatain       = businessdatain
        buspartyin           = buspartyin
        extensionin          = extensionin
        headtextin           = headtextin
        itemtextin           = itemtextin
        itemdataout          = itemdataout
        scheduledataout      = scheduledataout
        businessdataout      = businessdataout
        buspartyout          = buspartyout
        headtextout          = headtextout
        itemtextout          = itemtextout
        extensionout         = extensionout
        return               = return
        partneraddresses     = partneraddresses
        vendorcondin         = vendorcondin
        customercondin       = customercondin
        conditionkeydatain   = conditionkeydatain
        conditionkeydatainx  = conditionkeydatainx
        conditionitemdatain  = conditionitemdatain
        conditionitemdatainx = conditionitemdatainx
        conditionkeydataout  = conditionkeydataout
        conditionitemdataout = conditionitemdataout
        scaledatain          = scaledatain
        scaledataout         = scaledataout
        vendorcondout        = vendorcondout
        customercondout      = customercondout.
    SET PARAMETER ID 'BAPIHT' FIELD ''.

    lif_bapi~document = tradingcontractno.
    lif_bapi~mt_bapiret2 = CORRESPONDING #( return ).

    CALL FUNCTION 'Z_MESSAGE_TABLE_TO_FIELD'
      EXPORTING
        t_bapiret2 = lif_bapi~mt_bapiret2
      IMPORTING
        status     = lif_bapi~status
        message    = lif_bapi~message.

    " 发生错误或测试执行的情况，不提交
    IF lif_bapi~status = 'E' OR testrun = abap_true.
      CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
      CLEAR lif_bapi~document.
      RETURN.
    ENDIF.

    " 正式提交
    CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
      EXPORTING
        wait = abap_true.

  ENDMETHOD.

  METHOD set_head.

    DATA(ls_head) = input->ms_head.

    " 抬头数据
    headdatain-tkonn_ex        = ls_head-tkonn_ex.
    headdatain-trcont_type     = ls_head-tctyp.
    headdatain-tew_type        = ls_head-tew_type.
    headdatain-trcont_stat     = ls_head-btbsta.
    headdatain-trcont_currency = ls_head-waers.
    headdatain-currency        = ls_head-waers.
    headdatain-purch_no        = ls_head-bstkd.
    headdatain-comp_code       = ls_head-zzsign_platfrom.
    headdatain-sales_grp       = ls_head-ekgrp.
    headdatain-sales_off       = ls_head-ekorg.
    headdatain-sales_org       = ls_head-zzsign_platfrom.
    headdatain-distr_chan      = ls_head-vtweg.
    headdatain-division        = ls_head-spart.
    IF headdatain-tew_type IS INITIAL.
      headdatain-tew_type = 'Z001'.
    ENDIF.
    IF headdatain-distr_chan IS INITIAL.
      headdatain-distr_chan = '10'.
    ENDIF.
    IF headdatain-division IS INITIAL.
      headdatain-division = '11'.
    ENDIF.

    " 抬头数据扩展字段
    ms_bapi_te_wbhk-vkgrp           = ls_head-ekgrp.
    ms_bapi_te_wbhk-vkbur           = ls_head-ekorg.
    ms_bapi_te_wbhk-tkonn_ex        = ls_head-tkonn_ex.
    ms_bapi_te_wbhk-guarantee_f     = ls_head-guarantee_f        .
    ms_bapi_te_wbhk-ciq_lastdt      = ls_head-ciq_lastdt         .
    ms_bapi_te_wbhk-consnno         = ls_head-consnno            .
    ms_bapi_te_wbhk-zframe_tkonn    = ls_head-zframe_tkonn        .
    ms_bapi_te_wbhk-zzsndat         = ls_head-zzsndat             .
    ms_bapi_te_wbhk-zprictp         = ls_head-zprictp             .
    ms_bapi_te_wbhk-zzlsch_mm       = ls_head-zzlsch_mm           .
    ms_bapi_te_wbhk-zzlsch_txt_mm_n = ls_head-zzlsch_mm_ex        .
    ms_bapi_te_wbhk-zzlsch_sd       = ls_head-zzlsch_sd           .
    ms_bapi_te_wbhk-zzlsch_txt_sd_n = ls_head-zzlsch_sd_ex        .
    ms_bapi_te_wbhk-zzrpdate_end    = ls_head-zzrpdate_end        .
*   ms_bapi_te_wbhk-zzrpdate_end_ex = ls_head-zzrpdate_end_ex     .
    ms_bapi_te_wbhk-zzamt01_mm      = ls_head-zzamt01_mm          .
    ms_bapi_te_wbhk-zzcur01_mm      = ls_head-zzcur01_mm          .
*   ms_bapi_te_wbhk-zzamt01_mm_ex   = ls_head-zzamt01_mm_ex       .
    ms_bapi_te_wbhk-zzpcode_src     = ls_head-zzpcode_src         .
    ms_bapi_te_wbhk-zzland1_src     = ls_head-zzland1_src         .
    ms_bapi_te_wbhk-zzpname_src     = ls_head-zzpname_src         .
    ms_bapi_te_wbhk-zzpcode_des     = ls_head-zzpcode_des         .
    ms_bapi_te_wbhk-zzland1_des     = ls_head-zzland1_des         .
    ms_bapi_te_wbhk-zzpname_des     = ls_head-zzpname_des         .
    ms_bapi_te_wbhk-zzpcode_tra     = ls_head-zzpcode_tra         .
    ms_bapi_te_wbhk-zzland1_tra     = ls_head-zzland1_tra         .
    ms_bapi_te_wbhk-zzpname_tra     = ls_head-zzpname_tra         .
    ms_bapi_te_wbhk-zzis_preins     = ls_head-zzis_preins         .
    ms_bapi_te_wbhk-zzzcdh_date     = ls_head-zzreceived_data_last.
    ms_bapi_te_wbhk-zzlaycanq       = ls_head-zzlaycan_from       .
    ms_bapi_te_wbhk-zzlaycanz       = ls_head-zzlaycan_to         .
*   ms_bapi_te_wbhk-zzlogistics_ex  = ls_head-zzlogistics_ex      .
    ms_bapi_te_wbhk-zzbusst         = ls_head-zzbusst             .
    ms_bapi_te_wbhk-zzsnfile        = ls_head-zzsnfile            .
    ms_bapi_te_wbhk-zzsnflg         = ls_head-zzsnflg             .
    ms_bapi_te_wbhk-zzwd_tcdoc_flg  = ls_head-zzwd_tcdoc_flg      .
    ms_bapi_te_wbhk-zzyqd           = ls_head-zzyqd               .
    ms_bapi_te_wbhk-zzstpga_flg     = ls_head-zzstpga_flg         .
    ms_bapi_te_wbhk-zzgmyw_flg      = ls_head-zzgmyw_flg          .
    ms_bapi_te_wbhk-zzflexible      = ls_head-zzflexible          .
    ms_bapi_te_wbhk-zzwtcgp         = ls_head-zzwtcgp             .
    ms_bapi_te_wbhk-zzwtcgp_rt      = ls_head-zzwtcgp_rt          .
*   ms_bapi_te_wbhk-zzwtcgp_rt_ex   = ls_head-zzwtcgp_rt_ex       .
*   ms_bapi_te_wbhk-zztext1         = ls_head-zztext1             .
*   ms_bapi_te_wbhk-zztext2         = ls_head-zztext2             .
    ms_bapi_te_wbhk-zzwtc_fvdate    = ls_head-zzwtc_fvdate        .
    ms_bapi_te_wbhk-zzwtc_fvtime    = ls_head-zzwtc_fvtime        .
    ms_bapi_te_wbhk-zzwtc_fvapper   = ls_head-zzwtc_fvapper       .
    ms_bapi_te_wbhk-zzefeupt_date   = ls_head-zzefeupt_date       .
    ms_bapi_te_wbhk-zzefeupt_time   = ls_head-zzefeupt_time       .
    ms_bapi_te_wbhk-zzefeupt_name   = ls_head-zzefeupt_apper      .
    ms_bapi_te_wbhk-zzpreclo_date   = ls_head-zzpreclo_date       .
    ms_bapi_te_wbhk-zzpreclo_time   = ls_head-zzpreclo_time       .
    ms_bapi_te_wbhk-zzpreclo_name   = ls_head-zzpreclo_apper      .
    ms_bapi_te_wbhk-zznatclo_date   = ls_head-zznatclo_date       .
    ms_bapi_te_wbhk-zznatclo_time   = ls_head-zznatclo_time       .
    ms_bapi_te_wbhk-zznatclo_name   = ls_head-zznatclo_apper      .
    ms_bapi_te_wbhk-zzfdclo_date    = ls_head-zzcancel_date       .
    ms_bapi_te_wbhk-zzfdclo_time    = ls_head-zzcancel_time       .
    ms_bapi_te_wbhk-zzfdclo_name    = ls_head-zzcancel_apper      .
*   ms_bapi_te_wbhk-zzfield1        = ls_head-zzfield1            .
*   ms_bapi_te_wbhk-zzfield2        = ls_head-zzfield2            .
*   ms_bapi_te_wbhk-zzfield3        = ls_head-zzfield3            .
*   ms_bapi_te_wbhk-zzfield4        = ls_head-zzfield4            .
*   ms_bapi_te_wbhk-zzfield5        = ls_head-zzfield5            .
*   ms_bapi_te_wbhk-zzfield6        = ls_head-zzfield6            .
*   ms_bapi_te_wbhk-zzfield7        = ls_head-zzfield7            .
*   ms_bapi_te_wbhk-zzfield8        = ls_head-zzfield8            .
*   ms_bapi_te_wbhk-zzfield9        = ls_head-zzfield9            .

  ENDMETHOD.

  METHOD set_bussiness.

    DATA(ls_head) = input->ms_head.

    " 业务数据首行是抬头用的
    DATA ls_businessdatain TYPE bapitcbus.
    CLEAR ls_businessdatain.
    ls_businessdatain-vendor        = ls_head-lifnr   .
    ls_businessdatain-pmnttrms      = ls_head-zterm          .
    ls_businessdatain-currency      = ls_head-waers          .
    ls_businessdatain-exch_rate_p   = ls_head-tkrate_mm      .
    ls_businessdatain-exchg_rate    = ls_head-kurst_mm       .
    ls_businessdatain-exch_rate_v   = ls_head-tkrate_sd      .
*   ls_businessdatain-kurst_sd      = ls_head-kurst_sd       .
    ls_businessdatain-incoterms1    = ls_head-inco1_mm       .
    ls_businessdatain-incoterms2    = ls_head-inco1_mm_ex    .
    ls_businessdatain-incoterms1_sd = ls_head-inco1_sd       .
    ls_businessdatain-incoterms2_sd = ls_head-inco1_sd_ex    .
    ls_businessdatain-purch_org     = ls_head-ekorg          .
    ls_businessdatain-pur_group     = ls_head-ekgrp          .
    INSERT ls_businessdatain INTO TABLE businessdatain.

    " 日期处理
    DEFINE _clean_date.
      REPLACE ALL OCCURRENCES OF '[^0-9]' IN &1 WITH ''.
      IF &1 IS INITIAL.
        &1 = '00000000'.
      ENDIF.
    END-OF-DEFINITION.
    _clean_date ls_head-zzshipping_data_last.
    _clean_date ls_head-zzreceived_data_last.

    " 行项目增强结构
    DATA ls_bapi_te_wbhd TYPE bapi_te_wbhd.
    CLEAR ls_bapi_te_wbhd.
    ls_bapi_te_wbhd-bstdk      = ls_head-bstkd.
    ls_bapi_te_wbhd-edatu_vbak = ls_head-zzshipping_data_last.
    ls_bapi_te_wbhd-eindt      = ls_head-zzreceived_data_last.
    INSERT ls_bapi_te_wbhd INTO TABLE mt_bapi_te_wbhd.

  ENDMETHOD.

  METHOD set_item.

    DATA(ls_head) = input->ms_head.
    DATA(lt_item) = input->mt_item.

    DATA ls_itemdatain TYPE bapitcitem.
    DATA ls_bapi_te_wbhi TYPE bapi_te_wbhi.

    " 行项目
    LOOP AT lt_item INTO DATA(ls_item).
      IF ls_item-tposn IS INITIAL.
        ls_item-tposn = sy-tabix * 10.
      ENDIF.

      CLEAR ls_itemdatain.
      ls_itemdatain-trcont_item    = ls_item-tposn.
      ls_itemdatain-trcont_subitem = ls_item-tposn_sub.
      ls_itemdatain-plant          = ls_head-zzsign_platfrom.
      ls_itemdatain-material       = ls_item-matnr.
      ls_itemdatain-material_long  = ls_item-matnr.
      ls_itemdatain-short_text     = ls_item-arktx.

      ls_itemdatain-req_qty = ls_item-menge.
      ls_itemdatain-ordered = ls_item-menge.
      ls_itemdatain-po_unit = ls_item-meins.

      ls_itemdatain-sales_price = ls_item-netpr_mm.
      ls_itemdatain-sales_unit  = ls_item-meins.
      ls_itemdatain-currency    = ls_item-waers_mm.

      ls_itemdatain-pur_price    = ls_item-netpr_mm.
      ls_itemdatain-pur_currency = ls_item-waers_mm.
      ls_itemdatain-price_unit   = ls_item-peinh_mm.
      ls_itemdatain-stge_loc     = ls_item-lgort.
      INSERT ls_itemdatain INTO TABLE itemdatain.

      " 行项目增强结构
      CLEAR ls_bapi_te_wbhi.
      ls_bapi_te_wbhi-trcont_item    = ls_item-tposn    .
      ls_bapi_te_wbhi-trcont_subitem = ls_item-tposn_sub.
      ls_bapi_te_wbhi-uebto_mm       = ls_item-uebto_mm .
      ls_bapi_te_wbhi-untto_mm       = ls_item-untto_mm .
      ls_bapi_te_wbhi-zprdcat        = ls_item-zprdcat  .
      ls_bapi_te_wbhi-zgrade         = ls_item-zgrade   .
      ls_bapi_te_wbhi-zzoland        = ls_item-zoland   .
      ls_bapi_te_wbhi-zfactory       = ls_item-zfactory .
      ls_bapi_te_wbhi-ztechstd       = ls_item-ztechstd .
      ls_bapi_te_wbhi-zccbz          = ls_item-zccbz    .
      ls_bapi_te_wbhi-zxnyy          = ls_item-zxnyy    .
      ls_bapi_te_wbhi-zyszjh         = ls_item-zyszjh   .
      ls_bapi_te_wbhi-zysdjh         = ls_item-zysdjh   .
      ls_bapi_te_wbhi-zbgdh          = ls_item-zbgdh    .
      ls_bapi_te_wbhi-zkwh           = ls_item-zkwh     .
      ls_bapi_te_wbhi-zscrq          = ls_item-zscrq    .
      ls_bapi_te_wbhi-zzdysx1        = ls_item-zzdysx1  .
      ls_bapi_te_wbhi-zzdysx2        = ls_item-zzdysx2  .
      ls_bapi_te_wbhi-zzdysx3        = ls_item-zzdysx3  .
      ls_bapi_te_wbhi-zpcmark        = ls_item-zpcmark  .
      INSERT ls_bapi_te_wbhi INTO TABLE mt_bapi_te_wbhi.
    ENDLOOP.

  ENDMETHOD.

  METHOD set_partner.

    DATA(ls_head) = input->ms_head.
    DATA(lt_partner) = input->mt_partner.

    DATA ls_buspartyin TYPE bapitcparty.
    DATA lr_buspartyin TYPE REF TO bapitcparty.
    DATA ls_bapi_te_wbhp TYPE bapi_te_wbhp.

    " 合作伙伴数据
    LOOP AT lt_partner INTO DATA(ls_partner).
      CLEAR ls_buspartyin.
      ls_buspartyin-trcont_item    = ls_partner-tposn    .
      ls_buspartyin-trcont_subitem = ls_partner-tposn_sub.
      ls_buspartyin-partn_role     = ls_partner-parvw    .
      ls_buspartyin-partcount      = ls_partner-pstlz    .
      ls_buspartyin-vendor_no      = ls_partner-lifnr    .
      ls_buspartyin-cust_no        = ls_partner-kunnr    .
      ls_buspartyin-address        = ls_partner-adrnr    .
      INSERT ls_buspartyin INTO TABLE buspartyin.
    ENDLOOP.

    " 重复代码
    " &1: 合作伙伴角色
    " &2: 供应商编码
    DEFINE _add_partner.
      IF &3 IS NOT INITIAL.
        READ TABLE buspartyin REFERENCE INTO lr_buspartyin WITH KEY partn_role = &2.
        IF sy-subrc <> 0.
          INSERT VALUE #(
            partn_role = &2
          ) INTO TABLE buspartyin REFERENCE INTO lr_buspartyin.
        ENDIF.
        lr_buspartyin->&1 = &3.
      ENDIF.
    END-OF-DEFINITION.
    DEFINE _add_partner_vendor.
      _add_partner vendor_no &1 &2.
    END-OF-DEFINITION.

    " 如果合同伙伴中没这些对象，则根据抬头取值
    _add_partner_vendor 'LF' ls_head-lifnr.
    _add_partner_vendor 'Z4' ls_head-lifnr2.
    _add_partner_vendor 'Z1' ls_head-lifnr3.
    _add_partner_vendor 'ZM' ls_head-lifnr4.

  ENDMETHOD.

  METHOD set_condition.

    DATA(ls_head) = input->ms_head.
    DATA(lt_condition) = input->mt_condition.

    " 查询采购定价过程
    SELECT SINGLE kalsk FROM lfm1 WHERE lifnr = @ls_head-lifnr AND ekorg = @ls_head-ekorg INTO @DATA(l_kalsk).
    SELECT SINGLE kalsm FROM tmks WHERE kalse = '1000' AND kalsk = @l_kalsk INTO @DATA(l_kalsm).
    SELECT * FROM t683s WHERE kalsm = @l_kalsm INTO TABLE @DATA(lt_pricing_process).
    SORT lt_pricing_process BY kschl.

    " 采购（供应商）定价
    DATA ls_vendorcondin TYPE bapitccond.
    LOOP AT lt_condition INTO DATA(ls_condition).
      " 补全编码
      IF ls_condition-tposn IS INITIAL.
        ls_condition-tposn = sy-tabix * 10.
      ENDIF.
      IF ls_condition-zaehk IS INITIAL.
        ls_condition-zaehk = '001'.
      ENDIF.

      " 获取条件类型对应条件过程中的顺序
      READ TABLE lt_pricing_process INTO DATA(ls_pricing_process) WITH KEY kschl = ls_condition-kschl BINARY SEARCH.
      IF sy-subrc <> 0.
        CLEAR ls_pricing_process.
      ENDIF.

      CLEAR ls_vendorcondin.
      ls_vendorcondin-trcont_item    = ls_condition-tposn.
      ls_vendorcondin-trcont_subitem = ls_condition-tposn_sub.
      ls_vendorcondin-cond_st_no     = ls_pricing_process-stunr.
      ls_vendorcondin-cond_count     = '001'.
      ls_vendorcondin-applicatio     = ls_pricing_process-kappl.
      ls_vendorcondin-cond_type = ls_condition-kschl.
      ls_vendorcondin-cond_base = ls_condition-kbetr.
      ls_vendorcondin-currency = ls_condition-waers.
      ls_vendorcondin-cond_p_unt = ls_condition-kpein.
      ls_vendorcondin-cond_unit = ls_condition-kmein.
      INSERT ls_vendorcondin INTO TABLE vendorcondin.
    ENDLOOP.

*    " 费用定价
*    DATA ls_conditionkeydatain TYPE bapitcconditionkey.
*    DATA ls_conditionitemdatain TYPE bapitcconditionitem.
*    LOOP AT mt_condition INTO DATA(ls_condition).
*      DATA(l_order_key) = sy-tabix * 10.
*
*      CLEAR ls_conditionkeydatain.
*      ls_conditionkeydatain-order_key = l_order_key.
*      ls_conditionkeydatain-application = 'M'.
**      ls_conditionkeydatain-cond_group_no = 'G002'.
*      ls_conditionkeydatain-cond_type = ls_condition-kschl.
*      ls_conditionkeydatain-purch_org = ms_head-ekorg.
*      ls_conditionkeydatain-vendor = ms_head-lifnr.
*      INSERT ls_conditionkeydatain INTO TABLE conditionkeydatain.
*
*      CLEAR ls_conditionitemdatain.
*      ls_conditionitemdatain-order_key = l_order_key.
*      ls_conditionitemdatain-cond_count = ls_condition-kposn.
*      ls_conditionitemdatain-amount = ls_condition-kbetr.
*      ls_conditionitemdatain-condcurr = ls_condition-waers.
*      ls_conditionitemdatain-cond_p_unt = ls_condition-kpein.
*      ls_conditionitemdatain-cond_unit = ls_condition-kmein.
*      INSERT ls_conditionitemdatain INTO TABLE conditionitemdatain.
*    ENDLOOP.

  ENDMETHOD.

  METHOD set_text.
  ENDMETHOD.

ENDCLASS.


*&---------------------------------------------------------------------*
*& Class (Implementation) lcl_bapi_ctr_change
*&---------------------------------------------------------------------*
*&
*&---------------------------------------------------------------------*
CLASS lcl_bapi_ctr_change IMPLEMENTATION.

  METHOD lif_bapi~execute.

    result = me.

    " 增强字段长度大于960，无法使用extensionin字段
    " 因此通过BAPI增强的方式，将值传入
    " 由于是静态参数，等价于内存传值，而且更好的溯源
    zcl_im__wb2_bapi_enhance_ex=>set_extension(
      EXPORTING
        bapi_te_wbhk    = ms_bapi_te_wbhk
        t_bapi_te_wbhi  = mt_bapi_te_wbhi
        t_bapi_te_wbhd  = mt_bapi_te_wbhd
        t_bapi_te_wbhe  = mt_bapi_te_wbhe
        t_bapi_te_wbhp  = mt_bapi_te_wbhp
        bapi_te_wbhkx   = ms_bapi_te_wbhkx
        t_bapi_te_wbhix = mt_bapi_te_wbhix
        t_bapi_te_wbhdx = mt_bapi_te_wbhdx
        t_bapi_te_wbhex = mt_bapi_te_wbhex
        t_bapi_te_wbhpx = mt_bapi_te_wbhpx
    ).

    headdatain-testrun = testrun.
    SET PARAMETER ID 'BAPIHT' FIELD 'X'." BAPI创建合同，用于跳过部分校验
    CALL FUNCTION 'BAPI_TRADINGCONTRACT_CHANGE'
      EXPORTING
        tradingcontractno    = tradingcontractno
        headdatain           = headdatain
        headdatainx          = headdatainx
      IMPORTING
        headdataout          = headdataout
      TABLES
        itemdatain           = itemdatain
        itemdatainx          = itemdatainx
        scheduledatain       = scheduledatain
        scheduledatainx      = scheduledatainx
        businessdatain       = businessdatain
        businessdatainx      = businessdatainx
        buspartyin           = buspartyin
        buspartyinx          = buspartyinx
        extensionin          = extensionin
        headtextin           = headtextin
        itemtextin           = itemtextin
        itemdataout          = itemdataout
        scheduledataout      = scheduledataout
        businessdataout      = businessdataout
        buspartyout          = buspartyout
        headtextout          = headtextout
        itemtextout          = itemtextout
        extensionout         = extensionout
        return               = return
        partneraddresses     = partneraddresses
        partnerchanges       = partnerchanges
        vendorcondin         = vendorcondin
        vendorcondinx        = vendorcondinx
        customercondin       = customercondin
        customercondinx      = customercondinx
        conditionkeydatain   = conditionkeydatain
        conditionkeydatainx  = conditionkeydatainx
        conditionitemdatain  = conditionitemdatain
        conditionitemdatainx = conditionitemdatainx
        conditionkeydataout  = conditionkeydataout
        conditionitemdataout = conditionitemdataout
        scaledatain          = scaledatain
        scaledataout         = scaledataout
        vendorcondout        = vendorcondout
        customercondout      = customercondout.
    SET PARAMETER ID 'BAPIHT' FIELD ''.

    lif_bapi~document = tradingcontractno.
    lif_bapi~mt_bapiret2 = CORRESPONDING #( return ).

    CALL FUNCTION 'Z_MESSAGE_TABLE_TO_FIELD'
      EXPORTING
        t_bapiret2 = lif_bapi~mt_bapiret2
      IMPORTING
        status     = lif_bapi~status
        message    = lif_bapi~message.

    " 发生错误或测试执行的情况，不提交
    IF lif_bapi~status = 'E' OR testrun = abap_true.
      CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
      CLEAR lif_bapi~document.
      RETURN.
    ENDIF.

    " 正式提交
    CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
      EXPORTING
        wait = abap_true.

  ENDMETHOD.

  METHOD set_head.

    " 获取旧数据
    DATA(lo_old) = lcl_fiori_ctr_data=>read( input->ms_head-tkonn ).
    DATA(lo_new) = input.

    " 比较差异
    DATA lt_compare TYPE STANDARD TABLE OF zscompare_result.
    CALL FUNCTION 'Z_COMPARE_STRUCTURE'
      EXPORTING
        old    = lo_old->ms_head
        new    = lo_new->ms_head
      TABLES
        result = lt_compare.

    LOOP AT lt_compare REFERENCE INTO DATA(lr_compare) WHERE valid = abap_true AND changed = abap_true.
      CASE lr_compare->name.
        WHEN 'BTBSTA         '.
          MOVE lr_compare->value_new TO headdatain-trcont_stat    .
        WHEN 'WAERS          '.
          MOVE lr_compare->value_new TO headdatain-trcont_currency.
          MOVE lr_compare->value_new TO headdatain-currency       .
        WHEN 'BSTKD          '.
          MOVE lr_compare->value_new TO headdatain-purch_no       .
*        WHEN 'ZZSIGN_PLATFROM'.
*          MOVE lr_compare->value_new TO headdatain-comp_code      .
*          MOVE lr_compare->value_new TO headdatain-sales_org      .
*        WHEN 'EKGRP          '.
*          MOVE lr_compare->value_new TO headdatain-sales_grp      .
*        WHEN 'EKORG          '.
*          MOVE lr_compare->value_new TO headdatain-sales_off      .
*        WHEN 'VTWEG          '.
*          MOVE lr_compare->value_new TO headdatain-distr_chan     .
*        WHEN 'SPART          '.
*          MOVE lr_compare->value_new TO headdatain-division       .
        WHEN OTHERS.
      ENDCASE.
    ENDLOOP.

    " BAPIX结构自动打X
    CALL FUNCTION 'Z_SAME_FIELD_MARK'
      CHANGING
        data  = headdatain
        datax = headdatainx.

  ENDMETHOD.

  METHOD set_bussiness.

    " 获取旧数据
    DATA(lo_old) = lcl_fiori_ctr_data=>read( input->ms_head-tkonn ).
    DATA(lo_new) = input.

    " 比较差异
    DATA lt_compare TYPE STANDARD TABLE OF zscompare_result.
    CALL FUNCTION 'Z_COMPARE_STRUCTURE'
      EXPORTING
        old    = lo_old->ms_head
        new    = lo_new->ms_head
      TABLES
        result = lt_compare.

    DATA ls_businessdatain LIKE LINE OF businessdatain.
    DATA ls_businessdatainx LIKE LINE OF businessdatainx.

    LOOP AT lt_compare REFERENCE INTO DATA(lr_compare) WHERE valid = abap_true AND changed = abap_true.
      CASE lr_compare->name.
        WHEN 'LIFNR      '.
          MOVE lr_compare->value_new TO ls_businessdatain-vendor       .
        WHEN 'ZTERM      '.
          MOVE lr_compare->value_new TO ls_businessdatain-pmnttrms     .
        WHEN 'WAERS      '.
          MOVE lr_compare->value_new TO ls_businessdatain-currency     .
        WHEN 'TKRATE_MM  '.
          MOVE lr_compare->value_new TO ls_businessdatain-exch_rate_p  .
        WHEN 'KURST_MM   '.
          MOVE lr_compare->value_new TO ls_businessdatain-exchg_rate   .
        WHEN 'TKRATE_SD  '.
          MOVE lr_compare->value_new TO ls_businessdatain-exch_rate_v  .
        WHEN 'INCO1_MM   '.
          MOVE lr_compare->value_new TO ls_businessdatain-incoterms1   .
        WHEN 'INCO1_MM_EX'.
          MOVE lr_compare->value_new TO ls_businessdatain-incoterms2   .
        WHEN 'INCO1_SD   '.
          MOVE lr_compare->value_new TO ls_businessdatain-incoterms1_sd.
        WHEN 'INCO1_SD_EX'.
          MOVE lr_compare->value_new TO ls_businessdatain-incoterms2_sd.
*        WHEN 'EKORG      '.
*          MOVE lr_compare->value_new TO ls_businessdatain-purch_org    .
*        WHEN 'EKGRP      '.
*          MOVE lr_compare->value_new TO ls_businessdatain-pur_group    .
        WHEN OTHERS.
      ENDCASE.
    ENDLOOP.

    " BAPIX结构自动打X
    CALL FUNCTION 'Z_SAME_FIELD_MARK'
      CHANGING
        data  = ls_businessdatain
        datax = ls_businessdatainx.

    INSERT ls_businessdatain INTO TABLE businessdatain.
    INSERT ls_businessdatainx INTO TABLE businessdatainx.

  ENDMETHOD.

  METHOD set_item.

    " 获取旧数据
    DATA(lo_old) = lcl_fiori_ctr_data=>read( input->ms_head-tkonn ).
    DATA(lo_new) = input.

    DATA lt_compare TYPE STANDARD TABLE OF zscompare_result.

    DATA ls_itemdatain LIKE LINE OF itemdatain.
    DATA ls_itemdatainx LIKE LINE OF itemdatainx.

    LOOP AT lo_new->mt_item INTO DATA(ls_item_new).
      READ TABLE lo_old->mt_item INTO DATA(ls_item_old)
      WITH KEY
      tposn     = ls_item_new-tposn
      tposn_sub = ls_item_new-tposn_sub
      .
      " 新增行
      IF sy-subrc <> 0.
        ls_item_new-updateflag = 'I'.
        CLEAR ls_item_old.
      ENDIF.

*      " 旧行已删除，新增一行
*      IF ls_item_old-updateflag = 'D'.
*        ls_item_new-updateflag = 'I'.
*        CLEAR ls_item_old.
*      ENDIF.

      " 比较差异
      CLEAR lt_compare.
      CALL FUNCTION 'Z_COMPARE_STRUCTURE'
        EXPORTING
          old    = ls_item_old
          new    = ls_item_new
        TABLES
          result = lt_compare.

      ls_itemdatain-trcont_item    = ls_item_new-tposn    .
      ls_itemdatain-trcont_subitem = ls_item_new-tposn_sub.
      IF lo_old->ms_head-zzsign_platfrom <> lo_new->ms_head-zzsign_platfrom.
        ls_itemdatain-plant = lo_new->ms_head-zzsign_platfrom.
      ENDIF.

      LOOP AT lt_compare REFERENCE INTO DATA(lr_compare) WHERE valid = abap_true AND changed = abap_true.
        CASE lr_compare->name.
          WHEN 'MATNR   '.
            MOVE lr_compare->value_new TO ls_itemdatain-material    .
          WHEN 'ARKTX   '.
            MOVE lr_compare->value_new TO ls_itemdatain-short_text  .
          WHEN 'MENGE   '.
            MOVE lr_compare->value_new TO ls_itemdatain-req_qty     .
          WHEN 'MENGE   '.
            MOVE lr_compare->value_new TO ls_itemdatain-ordered     .
          WHEN 'MEINS   '.
            MOVE lr_compare->value_new TO ls_itemdatain-po_unit     .
          WHEN 'NETPR_MM'.
            MOVE lr_compare->value_new TO ls_itemdatain-sales_price .
          WHEN 'MEINS   '.
            MOVE lr_compare->value_new TO ls_itemdatain-sales_unit  .
          WHEN 'WAERS_MM'.
            MOVE lr_compare->value_new TO ls_itemdatain-currency    .
          WHEN 'NETPR_MM'.
            MOVE lr_compare->value_new TO ls_itemdatain-pur_price   .
          WHEN 'WAERS_MM'.
            MOVE lr_compare->value_new TO ls_itemdatain-pur_currency.
          WHEN 'PEINH_MM'.
            MOVE lr_compare->value_new TO ls_itemdatain-price_unit  .
          WHEN 'LGORT   '.
            MOVE lr_compare->value_new TO ls_itemdatain-stge_loc    .
          WHEN OTHERS.
        ENDCASE.
      ENDLOOP.

      " 自动打X
      CALL FUNCTION 'Z_SAME_FIELD_MARK'
        CHANGING
          data  = ls_itemdatain
          datax = ls_itemdatainx.
      ls_itemdatainx-updateflag = ls_item_new-updateflag.

      INSERT ls_itemdatain  INTO TABLE itemdatain.
      INSERT ls_itemdatainx INTO TABLE itemdatainx.
    ENDLOOP.

  ENDMETHOD.

  METHOD set_condition.

    " 获取旧数据
    DATA(lo_old) = lcl_fiori_ctr_data=>read( input->ms_head-tkonn ).
    DATA(lo_new) = input.

    DATA lt_compare TYPE STANDARD TABLE OF zscompare_result.

    DATA ls_vendorcondin LIKE LINE OF vendorcondin.
    DATA ls_vendorcondinx LIKE LINE OF vendorcondinx.

    " 查询采购定价过程
    SELECT SINGLE kalsk FROM lfm1
      WHERE lifnr = @lo_old->ms_head-lifnr
        AND ekorg = @lo_old->ms_head-ekorg
      INTO @DATA(l_kalsk).
    SELECT SINGLE kalsm FROM tmks WHERE kalse = '1000' AND kalsk = @l_kalsk INTO @DATA(l_kalsm).
    SELECT * FROM t683s WHERE kalsm = @l_kalsm INTO TABLE @DATA(lt_pricing_process).
    SORT lt_pricing_process BY kschl.

    " 采购（供应商）定价
    LOOP AT lo_new->mt_condition INTO DATA(ls_condition_new).
      READ TABLE lo_old->mt_condition INTO DATA(ls_condition_old)
      WITH KEY
      tposn     = ls_condition_new-tposn
      tposn_sub = ls_condition_new-tposn_sub
      knumv     = ls_condition_new-knumv
      kposn     = ls_condition_new-kposn
      stunr     = ls_condition_new-stunr
      zaehk     = ls_condition_new-zaehk
      .

      " 新增行
      IF sy-subrc <> 0.
        ls_condition_new-updateflag = 'I'.
        CLEAR ls_condition_new.
      ENDIF.

      ls_vendorcondin-trcont_item    = ls_condition_new-tposn    .
      ls_vendorcondin-trcont_subitem = ls_condition_new-tposn_sub.
      ls_vendorcondin-cond_st_no     = ls_condition_new-stunr    .
      ls_vendorcondin-cond_count     = ls_condition_new-zaehk    .

      LOOP AT lt_compare REFERENCE INTO DATA(lr_compare) WHERE valid = abap_true AND changed = abap_true.
        CASE lr_compare->name.
          WHEN 'KBETR'.
            MOVE lr_compare->value_new TO ls_vendorcondin-cond_base .
          WHEN 'WAERS'.
            MOVE lr_compare->value_new TO ls_vendorcondin-currency  .
          WHEN 'KPEIN'.
            MOVE lr_compare->value_new TO ls_vendorcondin-cond_p_unt.
          WHEN 'KMEIN'.
            MOVE lr_compare->value_new TO ls_vendorcondin-cond_unit .
          WHEN OTHERS.
        ENDCASE.
      ENDLOOP.

      CALL FUNCTION 'Z_SAME_FIELD_MARK'
        CHANGING
          data  = ls_vendorcondin
          datax = ls_vendorcondinx.

      ls_vendorcondinx-updateflag = ls_condition_new-updateflag.

      INSERT ls_vendorcondin INTO TABLE vendorcondin.
      INSERT ls_vendorcondinx INTO TABLE vendorcondinx.
    ENDLOOP.
  ENDMETHOD.

  METHOD set_partner  .

    " 获取旧数据
    DATA(lo_old) = lcl_fiori_ctr_data=>read( input->ms_head-tkonn ).
    DATA(lo_new) = input.

    DATA lt_compare TYPE STANDARD TABLE OF zscompare_result.

    DATA ls_partner_old LIKE LINE OF lo_old->mt_partner.
    DATA ls_partner_new LIKE LINE OF lo_new->mt_partner.
    DATA ls_buspartyin LIKE LINE OF buspartyin.
    DATA ls_buspartyinx LIKE LINE OF buspartyinx.

    " 合作伙伴数据
    DEFINE _to_partner.
      READ TABLE lo_new->mt_partner INTO ls_partner_new WITH KEY parvw = &1.
      IF sy-subrc <> 0.
        ls_partner_new =  VALUE #(
          parvw = &1
          updateflag = 'I'
          lifnr = lo_new->ms_head-&2
        ).
      ENDIF.

      READ TABLE lo_old->mt_partner INTO ls_partner_old WITH KEY parvw = &1.
      IF sy-subrc = 0.
        ls_partner_new-updateflag = 'U'.
      ENDIF.
    END-OF-DEFINITION.

    " 如果合同伙伴中没这些对象，则根据抬头取值
    _to_partner 'LF' lifnr.
    _to_partner 'Z4' lifnr2.
    _to_partner 'Z1' lifnr3.
    _to_partner 'ZM' lifnr4.

    LOOP AT lo_new->mt_partner INTO ls_partner_new.
      READ TABLE lo_old->mt_partner INTO ls_partner_old
      WITH KEY
      tposn     = ls_partner_new-tposn
      tposn_sub = ls_partner_new-tposn_sub
      parvw     = ls_partner_new-parvw
      .
      " 新增行
      IF sy-subrc <> 0.
        ls_partner_new-updateflag = 'I'.
        CLEAR ls_partner_old.
      ENDIF.

      " 比较差异
      CLEAR lt_compare.
      CALL FUNCTION 'Z_COMPARE_STRUCTURE'
        EXPORTING
          old    = ls_partner_old
          new    = ls_partner_new
        TABLES
          result = lt_compare.

      ls_buspartyin-trcont_item    = ls_partner_new-tposn.
      ls_buspartyin-trcont_subitem = ls_partner_new-tposn_sub.
      ls_buspartyin-partn_role     = ls_partner_new-parvw.
      ls_buspartyin-partcount      = ls_partner_new-pstlz.

      LOOP AT lt_compare REFERENCE INTO DATA(lr_compare) WHERE valid = abap_true AND changed = abap_true.
        CASE lr_compare->name.
          WHEN 'LIFNR   '.
            MOVE lr_compare->value_new TO ls_buspartyin-vendor_no.
          WHEN 'KUNNR   '.
            MOVE lr_compare->value_new TO ls_buspartyin-cust_no.
          WHEN OTHERS.
        ENDCASE.
      ENDLOOP.

      CALL FUNCTION 'Z_SAME_FIELD_MARK'
        CHANGING
          data  = ls_buspartyin
          datax = ls_buspartyinx.
      ls_buspartyinx-updateflag = ls_partner_new-updateflag.

      INSERT ls_buspartyin INTO TABLE buspartyin.
      INSERT ls_buspartyinx INTO TABLE buspartyinx.
    ENDLOOP.

  ENDMETHOD.

  METHOD set_text     .
  ENDMETHOD.

ENDCLASS.

*&---------------------------------------------------------------------*
*& Class (Implementation) lcl_contract_service
*&---------------------------------------------------------------------*
*&
*&---------------------------------------------------------------------*
CLASS lcl_contract_service IMPLEMENTATION.

  METHOD create.

    DATA(lo_fiori_ctr_data) = data.

    DATA(lo_bapi_ctr_create) = NEW lcl_bapi_ctr_create( ).
    lo_bapi_ctr_create->set_head( lo_fiori_ctr_data ).
    lo_bapi_ctr_create->set_item( lo_fiori_ctr_data ).
    lo_bapi_ctr_create->set_bussiness( lo_fiori_ctr_data ).
    lo_bapi_ctr_create->set_partner( lo_fiori_ctr_data ).
    lo_bapi_ctr_create->set_condition( lo_fiori_ctr_data ).
    lo_bapi_ctr_create->set_text( lo_fiori_ctr_data ).

    " 执行创建bapi
    DATA(lo_bapi) = lo_bapi_ctr_create->lif_bapi~execute( testrun = abap_true ).
    IF lo_bapi->status <> 'E'.
      lo_bapi = lo_bapi->execute( ).
    ENDIF.
    " 更新付款信息
    IF lo_bapi->status = 'S'.
      lo_fiori_ctr_data->save_payment( ).
    ENDIF.

    contract = lo_bapi->document.
    status   = lo_bapi->status  .
    message  = lo_bapi->message .

  ENDMETHOD.

  METHOD change.

    DATA(lo_fiori_ctr_data) = data.

    DATA(lo_bapi_ctr_change) = NEW lcl_bapi_ctr_change( ).
    lo_bapi_ctr_change->set_head( lo_fiori_ctr_data ).
    lo_bapi_ctr_change->set_item( lo_fiori_ctr_data ).
    lo_bapi_ctr_change->set_bussiness( lo_fiori_ctr_data ).
    lo_bapi_ctr_change->set_partner( lo_fiori_ctr_data ).
    lo_bapi_ctr_change->set_condition( lo_fiori_ctr_data ).
    lo_bapi_ctr_change->set_text( lo_fiori_ctr_data ).

    " 执行创建bapi
    DATA(lo_bapi) = lo_bapi_ctr_change->lif_bapi~execute( testrun = abap_true ).
    IF lo_bapi->status <> 'E'.
      lo_bapi = lo_bapi->execute( ).
    ENDIF.
    " 更新付款信息
    IF lo_bapi->status = 'S'.
      lo_fiori_ctr_data->save_payment( ).
    ENDIF.

    contract = lo_bapi->document.
    status   = lo_bapi->status  .
    message  = lo_bapi->message .

  ENDMETHOD.

ENDCLASS.

```

</details>

***WB2_BAPI_ENHANCE_EX***：合同增强

***WB2_TC_INCOMP_LOG***，合同不完整日志增强

## 合同关闭
