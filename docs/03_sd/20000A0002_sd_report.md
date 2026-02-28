# 销售交货开票报表

报表主要用于跟踪销售订单后续交货和开票情况，核心是这三者的关联查询。

<details>
  <summary>主程序</summary>

```ABAP

*&---------------------------------------------------------------------*
*& Report ZSDREPORT
*&---------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*& 作者 Nefevcore
*& 描述 营销报表
*&---------------------------------------------------------------------*
REPORT zsdreport.

INCLUDE zsdreport_top.
INCLUDE zsdreport_sel.
INCLUDE zsdreport_frm.
INCLUDE zsdreport_alv.

START-OF-SELECTION.
  PERFORM frm_main.

```

</details>

<details>
  <summary>全局参数</summary>

```ABAP

*&---------------------------------------------------------------------*
*& 包含               ZSDREPORT_TOP
*&---------------------------------------------------------------------*
" 数量和金额
TYPES ty_amount_p16_4 TYPE p LENGTH 16 DECIMALS 4.
TYPES ty_quan_p16_3 TYPE p LENGTH 16 DECIMALS 3.

" 销售
TYPES:
  BEGIN OF ty_va,
    vbeln  TYPE vbap-vbeln, " 销售订单号
    posnr  TYPE vbap-posnr, " 销售订单行号
    vbtyp  TYPE vbak-vbtyp, " 凭证类型
    auart  TYPE vbak-auart, " 销售订单类型
    vkorg  TYPE vbak-vkorg, " 销售组织
    vtweg  TYPE vbak-vtweg, " 分销渠道
    spart  TYPE vbak-spart, " 产品组
    kwmeng TYPE vbap-kwmeng, " 订单数量
    zmeng  TYPE vbap-zmeng, " 目标数量
    meins  TYPE vbap-meins, " 单位
    kzwi1  TYPE vbap-kzwi1, " 销售小计
    waerk  TYPE vbap-waerk, " 货币
    knumv  TYPE vbak-knumv, " 条件号
    kbetr  TYPE prcd_elements-kbetr, " 定价值
    bstkd  TYPE vbkd-bstkd, " 客户参考
  END OF ty_va.

" 交货
TYPES:
  BEGIN OF ty_vl,
    vbeln     TYPE lips-vbeln, " 交货单号
    posnr     TYPE lips-posnr, " 行项目号
    vbtyp     TYPE likp-vbtyp, " 销售和分销凭证类别
    lfart     TYPE likp-lfart, " 交货类型
    wadat_ist TYPE likp-wadat_ist, " 实际交货日期
    uecha     TYPE lips-uecha, " 上层项目批
    wbsta     TYPE lips-wbsta, " 交货状态
    lfimg     TYPE lips-lfimg, " 发货数量
    meins     TYPE lips-meins, " 单位
  END OF ty_vl.

" 发票
TYPES:
  BEGIN OF ty_vf,
    vbeln TYPE vbrp-vbeln, " 发票
    posnr TYPE vbrp-posnr, " 发票行
    vbtyp TYPE vbrk-vbtyp, " 发票凭证类别
    fkdat TYPE vbrk-fkdat, " 开票日期
    fkimg TYPE vbrp-fkimg, " 开票数量
    meins TYPE vbrp-meins, " 单位
    kzwi1 TYPE vbrp-kzwi1, " 发票小计
    waerk TYPE vbrp-waerk, " 货币
  END OF ty_vf.

" 通用
TYPES:
  BEGIN OF ty_general,
    kunnr      TYPE likp-kunnr, " 送达方编码
    kunnr_text TYPE string, " 送达方名称
    kunag      TYPE likp-kunag, " 签署方编码
    kunag_text TYPE string, " 签署方名称
    kunre      TYPE kna1-kunnr, " 开票方编码
    kunre_text TYPE string, " 开票方名称
    kunrg      TYPE kna1-kunnr, " 付款方编码
    kunrg_text TYPE string, " 付款方名称
    matnr      TYPE mara-matnr, " 物料号
    maktx      TYPE makt-maktx,  " 物料描述
    werks      TYPE t001w-werks, " 工厂
    lgort      TYPE t001l-lgort, " 库位
    charg      TYPE mch1-charg, " SAP批次号
    pspnr      TYPE prps-pspnr, " WBS
    posid      TYPE prps-posid, " WBS
  END OF ty_general.

" ALV报表
TYPES:
  BEGIN OF ty_data.
    INCLUDE TYPE ty_va AS va RENAMING WITH SUFFIX _va.
    INCLUDE TYPE ty_vl AS vl RENAMING WITH SUFFIX _vl.
    INCLUDE TYPE ty_vf AS vf RENAMING WITH SUFFIX _vf.
    INCLUDE TYPE ty_general.
TYPES:
    zfactor   TYPE i, " 正负因子
    ztax_rate TYPE ty_amount_p16_4, " 税率

    zamount1  TYPE ty_amount_p16_4, " 销售单价
    zquan2    TYPE ty_quan_p16_3, " 销售数量
    zamount3  TYPE ty_amount_p16_4, " 销售含税总金额

    zamount4  TYPE ty_amount_p16_4, " 发货单价（取销售单价）
    zquan5    TYPE ty_quan_p16_3, " 交货数量
    zamount6  TYPE ty_amount_p16_4, " 发货含税总金额
    zquan7    TYPE ty_quan_p16_3, " 未交货数量
    zamount8  TYPE ty_amount_p16_4, " 未发货含税总金额

    zamount9  TYPE ty_amount_p16_4, " 开票单价
    zquan10   TYPE ty_quan_p16_3, " 开票数量
    zamount11 TYPE ty_amount_p16_4, " 开票含税总金额
    zquan12   TYPE ty_quan_p16_3, " 未开票数量
    zamount13 TYPE ty_amount_p16_4, " 未开票含税总金额

    zsel      TYPE xfeld,
    mtype     TYPE bapi_mtype,
    msg       TYPE bapi_msg,
    t_scol    TYPE lvc_t_scol,
    t_styl    TYPE lvc_t_styl,
  END OF ty_data.
TYPES tt_data TYPE STANDARD TABLE OF ty_data.
DATA gt_data TYPE tt_data.

" 查询优化
" 按正常流程，需要先查询销售或交货，最后到发票
" 如果用户仅在筛选界面输入发票，等同全量查询
" 这样耗时太长，因此可以根据选择界面输入，预先查询
DATA:
  BEGIN OF gs_preload,
    va TYPE xfeld,
    vl TYPE xfeld,
    vf TYPE xfeld,
  END OF gs_preload.

" 键值
TYPES:
  BEGIN OF ty_sdkey,
    vbeln TYPE vbeln,
    posnr TYPE posnr,
  END OF ty_sdkey.
TYPES tt_sdkey TYPE STANDARD TABLE OF ty_sdkey.
DATA gt_sdkey TYPE tt_sdkey.

" 优化，程序写完后，多次出现过滤冲销发票的代码
TYPES:
  BEGIN OF ty_sfakn.
    INCLUDE TYPE ty_sdkey AS va RENAMING WITH SUFFIX _va.
    INCLUDE TYPE ty_sdkey AS vl RENAMING WITH SUFFIX _vl.
    INCLUDE TYPE ty_sdkey AS vf RENAMING WITH SUFFIX _vf.
TYPES:
    sfakn TYPE vbrk-sfakn,
  END OF ty_sfakn.
TYPES tt_sfakn TYPE STANDARD TABLE OF ty_sfakn.

```

</details>

<details>
  <summary>选择屏幕</summary>

```ABAP

*&---------------------------------------------------------------------*
*& 包含               ZSDREPORT_SEL
*&---------------------------------------------------------------------*
TABLES vbak.
TABLES vbap.
TABLES vbrk.
TABLES likp.
TABLES prps.

PARAMETERS cb1 AS CHECKBOX DEFAULT abap_true.
PARAMETERS cb2 AS CHECKBOX DEFAULT abap_true.

SELECTION-SCREEN ULINE.

" 选择条件
SELECTION-SCREEN BEGIN OF BLOCK b900 WITH FRAME TITLE b900.
  SELECT-OPTIONS s_matnr FOR vbap-matnr.
  SELECT-OPTIONS s_werks FOR vbap-werks.
  SELECT-OPTIONS s_lgort FOR vbap-lgort.
  SELECT-OPTIONS s_charg FOR vbap-charg.
*  SELECT-OPTIONS s_wbs FOR vbap-ps_psp_pnr.
  SELECT-OPTIONS s_wbs FOR prps-posid. " 用外码才能模糊查询
  SELECT-OPTIONS s_vkorg FOR vbak-vkorg.
  SELECT-OPTIONS s_vtweg FOR vbak-vtweg.
  SELECT-OPTIONS s_spart FOR vbak-spart.
  SELECT-OPTIONS s_kunnr FOR vbak-kunnr.
SELECTION-SCREEN END OF BLOCK b900.

" 销售信息
SELECTION-SCREEN BEGIN OF BLOCK b910 WITH FRAME TITLE b910.
  SELECT-OPTIONS s_vbnva FOR vbak-vbeln MODIF ID m10.
  SELECT-OPTIONS s_vbtva FOR vbak-vbtyp MODIF ID m10.
  SELECT-OPTIONS s_auart FOR vbak-auart MODIF ID m10.
SELECTION-SCREEN END OF BLOCK b910.

" 交货信息
SELECTION-SCREEN BEGIN OF BLOCK b920 WITH FRAME TITLE b920.
  SELECT-OPTIONS s_vbnvl FOR likp-vbeln MODIF ID m20.
  SELECT-OPTIONS s_vbtvl FOR likp-vbtyp MODIF ID m20.
  SELECT-OPTIONS s_lfart FOR likp-lfart MODIF ID m20.
  SELECT-OPTIONS s_wadat FOR likp-wadat_ist MODIF ID m20.
SELECTION-SCREEN END OF BLOCK b920.

" 发票信息
SELECTION-SCREEN BEGIN OF BLOCK b930 WITH FRAME TITLE b930.
  SELECT-OPTIONS s_vbnvf FOR vbrk-vbeln MODIF ID m30.
  SELECT-OPTIONS s_vbtvf FOR vbrk-vbtyp MODIF ID m30.
  SELECT-OPTIONS s_fkdat FOR vbrk-fkdat MODIF ID m30.
SELECTION-SCREEN END OF BLOCK b930.

*&---------------------------------------------------------------------*
*& INITIALIZATION
*&---------------------------------------------------------------------*
INITIALIZATION.
  PERFORM frm_sel_scr_init.

*&---------------------------------------------------------------------*
*& PBO
*&---------------------------------------------------------------------*
AT SELECTION-SCREEN OUTPUT.
  PERFORM frm_sel_scr_pbo.

*&---------------------------------------------------------------------*
*& PAI
*&---------------------------------------------------------------------*
AT SELECTION-SCREEN.
  PERFORM frm_sel_scr_pai.

*&---------------------------------------------------------------------*
*& Form frm_sel_scr_init
*&---------------------------------------------------------------------*
*& 屏幕初始化
*&---------------------------------------------------------------------*
FORM frm_sel_scr_init .

  %_cb1_%_app_%-text = '交货清单'.
  %_cb2_%_app_%-text = '服务开票清单'.

  b900 = '选择条件'.
  %_s_matnr_%_app_%-text = '物料'.
  %_s_werks_%_app_%-text = '工厂'.
  %_s_lgort_%_app_%-text = '库存地点'.
  %_s_charg_%_app_%-text = '批次'.
  %_s_wbs_%_app_%-text = 'WBS'.
  %_s_vkorg_%_app_%-text = '销售组织'.
  %_s_vtweg_%_app_%-text = '分销渠道'.
  %_s_spart_%_app_%-text = '产品组'.
  %_s_kunnr_%_app_%-text = '售达方'.

  b910 = '销售信息'.
  %_s_vbnva_%_app_%-text = '销售订单'.
  %_s_vbtva_%_app_%-text = '销售凭证类别'.
  %_s_auart_%_app_%-text = '销售凭证类型'.

  b920 = '交货信息'.
  %_s_vbnvl_%_app_%-text = '交货订单'.
  %_s_vbtvl_%_app_%-text = '交货凭证类别'.
  %_s_lfart_%_app_%-text = '交货类型'.
  %_s_wadat_%_app_%-text = '交货日期'.

  b930 = '发票信息'.
  %_s_vbnvf_%_app_%-text = '发票凭证'.
  %_s_vbtvf_%_app_%-text = '发票凭证类别'.
  %_s_fkdat_%_app_%-text = '开票日期'.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_sel_scr_pbo
*&---------------------------------------------------------------------*
*& 屏幕PBO
*&---------------------------------------------------------------------*
FORM frm_sel_scr_pbo .

  " 关闭全部分组项目，未分组会展示
  LOOP AT SCREEN.
    IF screen-group1 IS NOT INITIAL.
      screen-input = '0'.
      screen-invisible = '1'.
      MODIFY SCREEN.
    ENDIF.
  ENDLOOP.

  " 显示分组
  DEFINE _active_grp.
    LOOP AT SCREEN.
      IF screen-group1 = &1.
        screen-input = '1'.
        screen-invisible = '0'.
        MODIFY SCREEN.
      ENDIF.
    ENDLOOP.
  END-OF-DEFINITION.

  " 隐藏分组
  DEFINE _inactive_grp.
    LOOP AT SCREEN.
      IF screen-group1 = &1.
        screen-input = '0'.
        screen-invisible = '1'.
        MODIFY SCREEN.
      ENDIF.
    ENDLOOP.
  END-OF-DEFINITION.

  SET TITLEBAR 'TITLE' WITH '营销报表'.
  _active_grp 'M10'. " 销售信息
  _active_grp 'M20'. " 交货信息
  _active_grp 'M30'. " 发票信息

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_sel_scr_pai
*&---------------------------------------------------------------------*
*& 屏幕PAI
*&---------------------------------------------------------------------*
FORM frm_sel_scr_pai .

ENDFORM.

```

</details>

<details>
  <summary>子例程</summary>

```ABAP

*&---------------------------------------------------------------------*
*& 包含               ZSDREPORT_FRM
*&---------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*& Form frm_main
*&---------------------------------------------------------------------*
*& 程序入口
*&---------------------------------------------------------------------*
FORM frm_main .

  PERFORM frm_get_auth.
  PERFORM frm_get_data.
  PERFORM frm_display TABLES gt_data.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_auth
*&---------------------------------------------------------------------*
*& 权限相关
*&---------------------------------------------------------------------*
FORM frm_get_auth .

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_data
*&---------------------------------------------------------------------*
*& 取值相关
*&---------------------------------------------------------------------*
FORM frm_get_data .

  " 销售交货查询，以交货单为中心，查询对应销售凭证和开票凭证
  IF cb1 = abap_true.
    PERFORM frm_get_data_vl.
  ENDIF.
  " 无交货（服务/借贷项等）发票查询，以销售订单为中心，查询对应发票
  IF cb2 = abap_true.
    PERFORM frm_get_data_non_vl.
  ENDIF.

  CHECK gt_data IS NOT INITIAL.

  SORT gt_data BY vbeln_va posnr_va
                  vbeln_vl posnr_vl
                  vbeln_vf posnr_vf.

  DELETE ADJACENT DUPLICATES FROM gt_data COMPARING vbeln_va posnr_va
                                                    vbeln_vl posnr_vl
                                                    vbeln_vf posnr_vf.

  PERFORM frm_fetch_va.
  PERFORM frm_fetch_vl.
  PERFORM frm_fetch_vf.
  PERFORM frm_fetch_vbkd.
  PERFORM frm_fetch_vbpa.
  PERFORM frm_fetch_amount.
  PERFORM frm_fetch_text.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_vl_intersection
*&---------------------------------------------------------------------*
*& 取交集
*&---------------------------------------------------------------------*
FORM frm_intersection
  TABLES et_result TYPE tt_sdkey
  USING VALUE(it_sdkey1) TYPE tt_sdkey
        VALUE(it_sdkey2) TYPE tt_sdkey.

  CLEAR et_result[].

  CHECK it_sdkey1[] IS NOT INITIAL.
  CHECK it_sdkey2[] IS NOT INITIAL.

  DATA ls_sdkey TYPE ty_sdkey.

  IF lines( it_sdkey1 ) < lines( it_sdkey2 ).
    SORT it_sdkey2 BY vbeln posnr.
    LOOP AT it_sdkey1 INTO ls_sdkey.
      READ TABLE it_sdkey2 TRANSPORTING NO FIELDS WITH KEY
      vbeln = ls_sdkey-vbeln
      posnr = ls_sdkey-posnr
      BINARY SEARCH.
      IF sy-subrc = 0.
        INSERT ls_sdkey INTO TABLE et_result.
      ENDIF.
    ENDLOOP.
  ELSE.
    SORT it_sdkey1 BY vbeln posnr.
    LOOP AT it_sdkey2 INTO ls_sdkey.
      READ TABLE it_sdkey1 TRANSPORTING NO FIELDS WITH KEY
      vbeln = ls_sdkey-vbeln
      posnr = ls_sdkey-posnr
      BINARY SEARCH.
      IF sy-subrc = 0.
        INSERT ls_sdkey INTO TABLE et_result.
      ENDIF.
    ENDLOOP.
  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_filter_cancel_billing
*&---------------------------------------------------------------------*
*& 排除冲销和被冲销发票
*&---------------------------------------------------------------------*
FORM frm_filter_cancel_billing CHANGING ct_vf TYPE tt_sfakn.

  CHECK ct_vf[] IS NOT INITIAL.

  DATA(lt_cancel) = ct_vf[].
  SORT lt_cancel BY sfakn.
  LOOP AT ct_vf REFERENCE INTO DATA(lr_vf) WHERE sfakn IS INITIAL.
    READ TABLE lt_cancel INTO DATA(ls_cancel) WITH KEY sfakn = lr_vf->vbeln_vf BINARY SEARCH.
    IF sy-subrc = 0.
      lr_vf->sfakn = ls_cancel-vbeln_vf.
    ENDIF.
  ENDLOOP.
  CLEAR lt_cancel.
  DELETE ct_vf WHERE sfakn IS NOT INITIAL.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_data_vl
*&---------------------------------------------------------------------*
*& 销售交货查询，以交货单为中心，查询对应销售凭证和开票凭证
*&---------------------------------------------------------------------*
FORM frm_get_data_vl .

  CLEAR gs_preload.
  CLEAR gt_sdkey.

  PERFORM frm_preload_vl_from_vl.
  PERFORM frm_preload_vl_from_va.
  PERFORM frm_preload_vl_from_vf.

  IF gs_preload IS NOT INITIAL.
    " 预查询
    IF gt_sdkey IS NOT INITIAL.
      SELECT
        vbfa~vbelv AS vbeln_va,
        vbfa~posnv AS posnr_va,
        vbfa~vbeln AS vbeln_vl,
        vbfa~posnn AS posnr_vl
        FROM vbfa
        JOIN vbak ON vbfa~vbelv = vbak~vbeln
        JOIN likp ON vbfa~vbeln = likp~vbeln
        FOR ALL ENTRIES IN @gt_sdkey
        WHERE vbfa~vbeln = @gt_sdkey-vbeln
          AND vbfa~posnn = @gt_sdkey-posnr
        INTO TABLE @DATA(lt_vlva).
    ENDIF.
  ELSE.
    " 全量查询
    SELECT
      vbfa~vbelv AS vbeln_va,
      vbfa~posnv AS posnr_va,
      vbfa~vbeln AS vbeln_vl,
      vbfa~posnn AS posnr_vl
      FROM vbfa
      JOIN vbak ON vbfa~vbelv = vbak~vbeln
      JOIN likp ON vbfa~vbeln = likp~vbeln
      INTO TABLE @lt_vlva.
  ENDIF.

  CHECK lt_vlva IS NOT INITIAL.

  " 询报价/合同->销售，需要过滤这部分
  SELECT
    vbfa~vbelv AS vbeln_other,
    vbfa~posnv AS posnr_other,
    vbfa~vbeln AS vbeln_va,
    vbfa~posnn AS posnr_va
    FROM vbfa
    JOIN vbak AS other ON vbfa~vbelv = other~vbeln
    JOIN vbak AS va ON vbfa~vbeln = va~vbeln
    FOR ALL ENTRIES IN @lt_vlva
    WHERE vbfa~vbelv = @lt_vlva-vbeln_va
      AND vbfa~posnv = @lt_vlva-posnr_va
    INTO TABLE @DATA(lt_otherva).

  " 交货-发票
  IF lt_vlva IS NOT INITIAL.
    DATA lt_vlvf TYPE tt_sfakn.
    SELECT
      vbfa~vbelv AS vbeln_vl,
      vbfa~posnv AS posnr_vl,
      vbfa~vbeln AS vbeln_vf,
      vbfa~posnn AS posnr_vf,
      vbrk~sfakn
      FROM vbfa
      JOIN likp ON vbfa~vbelv = likp~vbeln
      JOIN vbrk ON vbfa~vbeln = vbrk~vbeln
      FOR ALL ENTRIES IN @lt_vlva
      WHERE vbfa~vbelv = @lt_vlva-vbeln_vl
        AND vbfa~posnv = @lt_vlva-posnr_vl
      INTO CORRESPONDING FIELDS OF TABLE @lt_vlvf.
    PERFORM frm_filter_cancel_billing CHANGING lt_vlvf. " 排除冲销和被冲销发票
  ENDIF.

  " 销售->发票
  " 对于退货交货，交货单后续无发票，需要根据销售订单查找
  DATA lt_vavf TYPE tt_sfakn.
  SELECT
    vbfa~vbelv AS vbeln_va,
    vbfa~posnv AS posnr_va,
    vbfa~vbeln AS vbeln_vf,
    vbfa~posnn AS posnr_vf,
    vbrk~sfakn " 冲销凭证
    FROM vbfa
    JOIN vbak ON vbfa~vbelv = vbak~vbeln
    JOIN vbrk ON vbfa~vbeln = vbrk~vbeln
    FOR ALL ENTRIES IN @lt_vlva
    WHERE vbfa~vbelv = @lt_vlva-vbeln_va
      AND vbfa~posnv = @lt_vlva-posnr_va
    INTO CORRESPONDING FIELDS OF TABLE @lt_vavf.
  PERFORM frm_filter_cancel_billing CHANGING lt_vavf. " 排除冲销和被冲销发票

  SORT lt_otherva BY vbeln_other posnr_other.
  SORT lt_vlvf BY vbeln_vl posnr_vl.
  SORT lt_vavf BY vbeln_va posnr_va.

  LOOP AT lt_vlva INTO DATA(ls_vlva).
    READ TABLE lt_otherva TRANSPORTING NO FIELDS WITH KEY
    vbeln_other = ls_vlva-vbeln_va
    posnr_other = ls_vlva-posnr_va
    BINARY SEARCH.
    IF sy-subrc = 0.
      CONTINUE.
    ENDIF.

    DATA ls_data TYPE ty_data.
    CLEAR ls_data.
    ls_data-vbeln_va = ls_vlva-vbeln_va.
    ls_data-posnr_va = ls_vlva-posnr_va.
    ls_data-vbeln_vl = ls_vlva-vbeln_vl.
    ls_data-posnr_vl = ls_vlva-posnr_vl.

    READ TABLE lt_vlvf INTO DATA(ls_vlvf) WITH KEY
    vbeln_vl = ls_data-vbeln_vl
    posnr_vl = ls_data-posnr_vl
    BINARY SEARCH.
    IF sy-subrc = 0.
      ls_data-vbeln_vf = ls_vlvf-vbeln_vf.
      ls_data-posnr_vf = ls_vlvf-posnr_vf.
    ELSE.
      READ TABLE lt_vavf INTO DATA(ls_vavf) WITH KEY
      vbeln_va = ls_data-vbeln_va
      posnr_va = ls_data-posnr_va
      BINARY SEARCH.
      IF sy-subrc = 0.
        ls_data-vbeln_vf = ls_vavf-vbeln_vf.
        ls_data-posnr_vf = ls_vavf-posnr_vf.
      ENDIF.
    ENDIF.

    INSERT ls_data INTO TABLE gt_data.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_preload_vl_from_vl
*&---------------------------------------------------------------------*
*& 直接按交货单查询
*&---------------------------------------------------------------------*
FORM frm_preload_vl_from_vl .

  IF s_vbnvl[] IS NOT INITIAL
  OR s_vbtvl[] IS NOT INITIAL
  OR s_lfart[] IS NOT INITIAL
  OR s_wadat[] IS NOT INITIAL
  OR s_matnr[] IS NOT INITIAL
  OR s_werks[] IS NOT INITIAL
  OR s_lgort[] IS NOT INITIAL
  OR s_charg[] IS NOT INITIAL
  OR s_wbs[]   IS NOT INITIAL
  OR s_kunnr[] IS NOT INITIAL
    .

    SELECT
      lips~vbeln,
      lips~posnr
      FROM likp
      JOIN lips ON likp~vbeln = lips~vbeln
      LEFT JOIN prps ON lips~ps_psp_pnr = prps~pspnr
      WHERE lips~vbeln IN @s_vbnvl
        AND likp~vbtyp IN @s_vbtvl
        AND likp~lfart IN @s_lfart
        AND likp~wadat IN @s_wadat
        AND likp~kunnr IN @s_kunnr
        AND lips~matnr IN @s_matnr
        AND lips~werks IN @s_werks
        AND lips~lgort IN @s_lgort
        AND lips~charg IN @s_charg
        AND prps~posid IN @s_wbs
      INTO TABLE @gt_sdkey.

    gs_preload-vl = abap_true. " 表示已执行预加载

  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_preload_vl_from_va
*&---------------------------------------------------------------------*
*& 根据销售订单查找交货单
*&---------------------------------------------------------------------*
FORM frm_preload_vl_from_va .

  IF s_vbnva[] IS NOT INITIAL
  OR s_vbtva[] IS NOT INITIAL
  OR s_auart[] IS NOT INITIAL
  .

    DATA lt_sdkey TYPE tt_sdkey.
    SELECT
      vbfa~vbeln AS vbeln,
      vbfa~posnn AS posnr
      FROM vbfa
      JOIN vbak ON vbfa~vbelv = vbak~vbeln
      JOIN likp ON vbfa~vbeln = likp~vbeln
      WHERE vbak~vbeln IN @s_vbnva
        AND vbak~vbtyp IN @s_vbtva
        AND vbak~auart IN @s_auart
      INTO TABLE @lt_sdkey.

    " 将当前查询结果和之前的查询结果取交集
    IF gs_preload IS INITIAL.
      gt_sdkey = lt_sdkey.
    ELSE.
      PERFORM frm_intersection TABLES gt_sdkey USING gt_sdkey lt_sdkey.
    ENDIF.
    gs_preload-va = abap_true. " 表示已执行预加载

  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_preload_vl_from_vf
*&---------------------------------------------------------------------*
*& 根据发票查找交货单
*&---------------------------------------------------------------------*
FORM frm_preload_vl_from_vf .

  IF s_vbnvf[] IS NOT INITIAL
  OR s_vbtvf[] IS NOT INITIAL
  OR s_fkdat[] IS NOT INITIAL
  .

    DATA lt_sdkey TYPE tt_sdkey.

    " 对于发票，先查找发票对应销售单，再根据销售单查找交货单
    " 这样一个流程，可以兼容退货的情况（对于退货，交货订单后续是物料凭证）
    DATA lt_vavf TYPE tt_sfakn.
    SELECT
      vbfa~vbelv AS vbeln_va,
      vbfa~posnv AS posnr_va,
      vbfa~vbeln AS vbeln_vf,
      vbfa~posnn AS posnr_vf,
      vbrk~sfakn " 冲销凭证
      FROM vbfa
      JOIN vbak ON vbfa~vbelv = vbak~vbeln
      JOIN vbrk ON vbfa~vbeln = vbrk~vbeln
      WHERE vbrk~vbeln IN @s_vbnvf
        AND vbrk~vbtyp IN @s_vbtvf
        AND vbrk~fkdat IN @s_fkdat
      INTO CORRESPONDING FIELDS OF TABLE @lt_vavf.
    PERFORM frm_filter_cancel_billing CHANGING lt_vavf. " 排除冲销和被冲销发票

    IF lt_vavf IS NOT INITIAL.
      SELECT
        vbfa~vbeln AS vbeln,
        vbfa~posnn AS posnr
        FROM vbfa
        JOIN vbak ON vbfa~vbelv = vbak~vbeln
        JOIN likp ON vbfa~vbeln = likp~vbeln
        FOR ALL ENTRIES IN @lt_vavf
        WHERE vbfa~vbelv = @lt_vavf-vbeln_va
          AND vbfa~posnv = @lt_vavf-posnr_va
        INTO TABLE @lt_sdkey.
    ENDIF.

    " 将当前查询结果和之前的查询结果取交集
    IF gs_preload IS INITIAL.
      gt_sdkey = lt_sdkey.
    ELSE.
      PERFORM frm_intersection TABLES gt_sdkey USING gt_sdkey lt_sdkey.
    ENDIF.
    gs_preload-vf = abap_true. " 表示有执行优化
  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_data_non_vl
*&---------------------------------------------------------------------*
*& 无交货（服务/借贷项等）发票查询，以销售订单为中心，查询对应发票
*&---------------------------------------------------------------------*
FORM frm_get_data_non_vl .

  CLEAR gs_preload.
  CLEAR gt_sdkey.

  PERFORM frm_preload_va_from_va.
  PERFORM frm_preload_va_from_vl.
  PERFORM frm_preload_va_from_vf.

  DATA lt_vavf TYPE tt_sfakn.

  IF gs_preload IS NOT INITIAL.
    " 预查询
    IF gt_sdkey IS NOT INITIAL.
      SELECT
        vbfa~vbelv AS vbeln_va,
        vbfa~posnv AS posnr_va,
        vbfa~vbeln AS vbeln_vf,
        vbfa~posnn AS posnr_vf,
        vbrk~sfakn " 冲销凭证
        FROM vbfa
        JOIN vbak ON vbfa~vbelv = vbak~vbeln
        JOIN vbrk ON vbfa~vbeln = vbrk~vbeln
        FOR ALL ENTRIES IN @gt_sdkey
        WHERE vbfa~vbelv = @gt_sdkey-vbeln
          AND vbfa~posnv = @gt_sdkey-posnr
        INTO CORRESPONDING FIELDS OF TABLE @lt_vavf.
    ENDIF.
  ELSE.
    " 全量查询
    SELECT
      vbfa~vbelv AS vbeln_va,
      vbfa~posnv AS posnr_va,
      vbfa~vbeln AS vbeln_vf,
      vbfa~posnn AS posnr_vf,
      vbrk~sfakn " 冲销凭证
      FROM vbfa
      JOIN vbak ON vbfa~vbelv = vbak~vbeln
      JOIN vbrk ON vbfa~vbeln = vbrk~vbeln
      INTO CORRESPONDING FIELDS OF TABLE @lt_vavf.
  ENDIF.
  PERFORM frm_filter_cancel_billing CHANGING lt_vavf. " 排除冲销和被冲销发票

  " 无交货判断
  IF lt_vavf IS NOT INITIAL.
    SELECT
      vbfa~vbelv AS vbeln_va,
      vbfa~posnv AS posnr_va,
      vbfa~vbeln AS vbeln_vl,
      vbfa~posnn AS posnr_vl
      FROM vbfa
      JOIN vbak ON vbfa~vbelv = vbak~vbeln
      JOIN likp ON vbfa~vbeln = likp~vbeln
      FOR ALL ENTRIES IN @lt_vavf
      WHERE vbfa~vbelv = @lt_vavf-vbeln_va
        AND vbfa~posnv = @lt_vavf-posnr_va
      INTO TABLE @DATA(lt_vavl).
  ENDIF.

  SORT lt_vavl BY vbeln_va posnr_va.

  LOOP AT lt_vavf INTO DATA(ls_vavf).
    READ TABLE lt_vavl TRANSPORTING NO FIELDS WITH KEY
    vbeln_va = ls_vavf-vbeln_va
    posnr_va = ls_vavf-posnr_va
    BINARY SEARCH.
    IF sy-subrc <> 0.
      INSERT CORRESPONDING #( ls_vavf ) INTO TABLE gt_data.
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_preload_vl_from_vl
*&---------------------------------------------------------------------*
*& 直接按交货单查询
*&---------------------------------------------------------------------*
FORM frm_preload_va_from_va.

  IF s_vbnva[] IS NOT INITIAL
  OR s_vbtva[] IS NOT INITIAL
  OR s_auart[] IS NOT INITIAL
  OR s_matnr[] IS NOT INITIAL
  OR s_werks[] IS NOT INITIAL
  OR s_lgort[] IS NOT INITIAL
  OR s_charg[] IS NOT INITIAL
  OR s_wbs[]   IS NOT INITIAL
  OR s_vkorg[] IS NOT INITIAL
  OR s_vtweg[] IS NOT INITIAL
  OR s_spart[] IS NOT INITIAL
  OR s_kunnr[] IS NOT INITIAL
    .

    SELECT
      vbap~vbeln,
      vbap~posnr
      FROM vbak
      JOIN vbap ON vbak~vbeln = vbap~vbeln
      LEFT JOIN prps ON vbap~ps_psp_pnr = prps~pspnr
      WHERE vbak~vbeln IN @s_vbnva
        AND vbak~vbtyp IN @s_vbtva
        AND vbak~auart IN @s_auart
        AND vbak~vkorg IN @s_vkorg
        AND vbak~vtweg IN @s_vtweg
        AND vbak~kunnr IN @s_kunnr
        AND vbap~spart IN @s_spart
        AND vbap~matnr IN @s_matnr
        AND vbap~werks IN @s_werks
        AND vbap~lgort IN @s_lgort
        AND vbap~charg IN @s_charg
        AND prps~posid IN @s_wbs
      INTO TABLE @gt_sdkey.

    gs_preload-va = abap_true. " 表示已执行预加载

  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_preload_va_from_vl
*&---------------------------------------------------------------------*
*& 不存在这种情况，但假设屏幕有输入交货相关
*&---------------------------------------------------------------------*
FORM frm_preload_va_from_vl .

  IF s_vbnvl[] IS NOT INITIAL
  OR s_vbtvl[] IS NOT INITIAL
  OR s_lfart[] IS NOT INITIAL
  .

    CLEAR gt_sdkey.
    gs_preload-vl = abap_true. " 表示已执行预加载

  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_preload_va_from_vf
*&---------------------------------------------------------------------*
*& 根据通过发票找销售订单
*&---------------------------------------------------------------------*
FORM frm_preload_va_from_vf.

  IF s_vbnvf[] IS NOT INITIAL
  OR s_vbtvf[] IS NOT INITIAL
  OR s_fkdat[] IS NOT INITIAL
  .

    DATA lt_vavf TYPE tt_sfakn.
    SELECT
      vbfa~vbelv AS vbeln_va,
      vbfa~posnv AS posnr_va,
      vbfa~vbeln AS vbeln_vf,
      vbfa~posnn AS posnr_vf,
      vbrk~sfakn " 冲销凭证
      FROM vbfa
      JOIN vbak ON vbfa~vbelv = vbak~vbeln
      JOIN vbrk ON vbfa~vbeln = vbrk~vbeln
      WHERE vbrk~vbeln IN @s_vbnvf
        AND vbrk~vbtyp IN @s_vbtvf
        AND vbrk~fkdat IN @s_fkdat
      INTO CORRESPONDING FIELDS OF TABLE @lt_vavf.
    PERFORM frm_filter_cancel_billing CHANGING lt_vavf." 排除冲销和被冲销发票

    " 无交货判断
    IF lt_vavf IS NOT INITIAL.
      SELECT
        vbfa~vbelv AS vbeln_va,
        vbfa~posnv AS posnr_va,
        vbfa~vbeln AS vbeln_vl,
        vbfa~posnn AS posnr_vl
        FROM vbfa
        JOIN vbak ON vbfa~vbelv = vbak~vbeln
        JOIN likp ON vbfa~vbeln = likp~vbeln
        FOR ALL ENTRIES IN @lt_vavf
        WHERE vbfa~vbeln = @lt_vavf-vbeln_va
          AND vbfa~posnn = @lt_vavf-posnr_va
        INTO TABLE @DATA(lt_vavl).
    ENDIF.

    SORT lt_vavl BY vbeln_va posnr_va.

    DATA lt_sdkey TYPE tt_sdkey.
    DATA ls_sdkey TYPE ty_sdkey.
    LOOP AT lt_vavf INTO DATA(ls_vavf).
      READ TABLE lt_vavl TRANSPORTING NO FIELDS WITH KEY
      vbeln_va = ls_vavf-vbeln_va
      posnr_va = ls_vavf-posnr_va
      BINARY SEARCH.
      IF sy-subrc <> 0.
        CLEAR ls_sdkey.
        ls_sdkey-vbeln = ls_vavf-vbeln_va.
        ls_sdkey-posnr = ls_vavf-posnr_va.
        INSERT ls_sdkey INTO TABLE lt_sdkey.
      ENDIF.
    ENDLOOP.

    " 将当前查询结果和之前的查询结果取交集
    IF gs_preload IS INITIAL.
      gt_sdkey = lt_sdkey.
    ELSE.
      PERFORM frm_intersection TABLES gt_sdkey USING gt_sdkey lt_sdkey.
    ENDIF.
    gs_preload-vf = abap_true. " 表示有执行优化

  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_fetch_va
*&---------------------------------------------------------------------*
*& 读取销售信息
*&---------------------------------------------------------------------*
FORM frm_fetch_va .
  CHECK gt_data IS NOT INITIAL.

  SELECT
    vbap~vbeln,
    vbap~posnr,
    vbak~vbtyp, " 凭证类型
    vbak~auart, " 销售订单类型
    vbak~vkorg, " 销售组织
    vbak~vtweg, " 分销渠道
    vbak~spart, " 产品组
    vbap~waerk, " 货币
    vbap~kzwi1, " 销售小计
    vbap~kwmeng, " 订单数量
    vbap~zmeng, " 目标数量
    vbak~knumv, " 条件号
    vbap~meins, " 单位
    vbap~matnr, " 物料
    vbap~werks, " 工厂
    vbap~lgort, " 库存地点
    prps~pspnr, " WBS
    prps~posid, " WBS
    vbap~charg " 批次
    FROM vbak
    JOIN vbap ON vbak~vbeln = vbap~vbeln
    LEFT JOIN prps ON vbap~ps_psp_pnr = prps~pspnr
    FOR ALL ENTRIES IN @gt_data
    WHERE vbak~vbeln = @gt_data-vbeln_va
    INTO TABLE @DATA(lt_va).
  SORT lt_va BY vbeln posnr.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    READ TABLE lt_va INTO DATA(ls_va) WITH KEY
    vbeln = lr_data->vbeln_va
    posnr = lr_data->posnr_va
    BINARY SEARCH.
    IF sy-subrc = 0.
      lr_data->va = CORRESPONDING #( ls_va ).
      lr_data->matnr = ls_va-matnr.
      lr_data->werks = ls_va-werks.
      lr_data->lgort = ls_va-lgort.
      lr_data->pspnr = ls_va-pspnr.
      lr_data->posid = ls_va-posid.
      lr_data->charg = ls_va-charg.
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_fetch_va
*&---------------------------------------------------------------------*
*& 读取交货单信息
*&---------------------------------------------------------------------*
FORM frm_fetch_vl .
  CHECK gt_data IS NOT INITIAL.

  SELECT
    lips~vbeln, " 交货订单
    lips~posnr, " 行项目
    likp~vbtyp, " 凭证类型
    likp~lfart, " 交货类型
    likp~wadat_ist, " 实际交货日期
    lips~uecha, " 上层行（判断行项目是否为拆分行）
    lips~wbsta, " 处理状态
    lips~lfimg, " 交货数量
    lips~meins, " 单位
    lips~matnr, " 物料
    lips~werks, " 工厂
    lips~lgort, " 库存地点
    prps~pspnr, " WBS
    prps~posid, " WBS
    lips~charg " 批次
    FROM likp
    JOIN lips ON likp~vbeln = lips~vbeln
    LEFT JOIN prps ON lips~ps_psp_pnr = prps~pspnr
    FOR ALL ENTRIES IN @gt_data
    WHERE likp~vbeln = @gt_data-vbeln_vl
    INTO TABLE @DATA(lt_vl).
  SORT lt_vl BY vbeln posnr.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    READ TABLE lt_vl INTO DATA(ls_vl) WITH KEY
    vbeln = lr_data->vbeln_vl
    posnr = lr_data->posnr_vl
    BINARY SEARCH.
    IF sy-subrc = 0.
      lr_data->vl = CORRESPONDING #( ls_vl ).
      lr_data->matnr = ls_vl-matnr.
      lr_data->werks = ls_vl-werks.
      lr_data->lgort = ls_vl-lgort.
      lr_data->pspnr = ls_vl-pspnr.
      lr_data->posid = ls_vl-posid.
      lr_data->charg = ls_vl-charg.
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_fetch_vf
*&---------------------------------------------------------------------*
*& 读取发票信息
*&---------------------------------------------------------------------*
FORM frm_fetch_vf .
  CHECK gt_data IS NOT INITIAL.

  SELECT
    vbrp~vbeln, " 发票
    vbrp~posnr, " 发票行
    vbrk~vbtyp, " 发票凭证类别
    vbrk~fkdat, " 开票日期
    vbrp~fkimg, " 开票数量
    vbrp~meins, " 单位
    vbrp~kzwi1, " 发票小计
    vbrp~waerk " 货币
    FROM vbrk
    JOIN vbrp ON vbrk~vbeln = vbrp~vbeln
    FOR ALL ENTRIES IN @gt_data
    WHERE vbrk~vbeln = @gt_data-vbeln_vf
    INTO TABLE @DATA(lt_vf).
  SORT lt_vf BY vbeln posnr.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    READ TABLE lt_vf INTO DATA(ls_vf) WITH KEY
    vbeln = lr_data->vbeln_vf
    posnr = lr_data->posnr_vf
    BINARY SEARCH.
    IF sy-subrc = 0.
      lr_data->vf = CORRESPONDING #( ls_vf ).
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_fetch_vbkd
*&---------------------------------------------------------------------*
*& 读取VBKD
*&---------------------------------------------------------------------*
FORM frm_fetch_vbkd .
  CHECK gt_data IS NOT INITIAL.

  SELECT
    vbeln,
    posnr,
    bstkd
    FROM vbkd
    FOR ALL ENTRIES IN @gt_data
    WHERE vbeln = @gt_data-vbeln_va
    INTO TABLE @DATA(lt_vbkd).
  SORT lt_vbkd BY vbeln posnr.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    READ TABLE lt_vbkd INTO DATA(ls_vbkd) WITH KEY
    vbeln = lr_data->vbeln_va
    BINARY SEARCH.
    IF sy-subrc = 0.
      lr_data->bstkd_va = ls_vbkd-bstkd.
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_fetch_vbpa
*&---------------------------------------------------------------------*
*& 销售业务货币
*&---------------------------------------------------------------------*
FORM frm_fetch_vbpa .
  CHECK gt_data IS NOT INITIAL.

  SELECT
    vbeln,
    parvw,
    kunnr
    FROM vbpa
    FOR ALL ENTRIES IN @gt_data
    WHERE vbeln = @gt_data-vbeln_va
      AND posnr = '' " 取抬头业务伙伴
    INTO TABLE @DATA(lt_vbpa).

  SORT lt_vbpa BY vbeln parvw.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).

    " 重复代码
    DATA ls_vbpa LIKE LINE OF lt_vbpa.
    DEFINE _get_partner.
      CLEAR ls_vbpa.
      READ TABLE lt_vbpa INTO ls_vbpa WITH KEY
      vbeln = lr_data->vbeln_va
      parvw = &1
      BINARY SEARCH.
      IF sy-subrc = 0.
        &2 = ls_vbpa-kunnr.
      ENDIF.
    END-OF-DEFINITION.

    _get_partner 'AG' lr_data->kunag.
    _get_partner 'RE' lr_data->kunre.
    _get_partner 'RG' lr_data->kunrg.

  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_fetch_amount
*&---------------------------------------------------------------------*
*& 数量与金额处理
*&---------------------------------------------------------------------*
FORM frm_fetch_amount .
  CHECK gt_data IS NOT INITIAL.

  SELECT
    knumv,
    kposn,
    stunr,
    zaehk,
    kschl,
    waers,
    kbetr,
    kpein
    FROM prcd_elements
    FOR ALL ENTRIES IN @gt_data
    WHERE knumv = @gt_data-knumv_va
      AND kinak = '' " 排除未激活的定价
    INTO TABLE @DATA(lt_prcd_elements).

  " 对于多个价格，取最新的
  SORT lt_prcd_elements BY knumv kposn kschl
                          zaehk DESCENDING .
  DELETE ADJACENT DUPLICATES FROM lt_prcd_elements COMPARING knumv kposn kschl.

  " 对于下面类型，数量金额按负数处理
  DATA lt_vbtyp_neg_opt TYPE RANGE OF vbtyp.
  lt_vbtyp_neg_opt = VALUE #( sign = 'I' option = 'EQ'
    ( low = 'H' ) " 退货
    ( low = 'T' ) " 订单的退货交货
    ( low = 'K' ) " 贷项凭证申请
    ( low = 'O' ) " 贷项凭证
  ).

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    " 重复代码
    DATA ls_prcd_elements LIKE LINE OF lt_prcd_elements.
    DEFINE _get_prcd_elements.
      READ TABLE lt_prcd_elements INTO ls_prcd_elements WITH KEY
      knumv = lr_data->knumv_va
      kposn = lr_data->posnr_va
      kschl = &1
      BINARY SEARCH.
      IF sy-subrc <> 0.
        CLEAR ls_prcd_elements.
      ENDIF.
    END-OF-DEFINITION.

    " 判断是否为退货之类
    IF lr_data->vbtyp_va IN lt_vbtyp_neg_opt
    OR lr_data->vbtyp_vl IN lt_vbtyp_neg_opt
    OR lr_data->vbtyp_vf IN lt_vbtyp_neg_opt.
      lr_data->zfactor = -1.
    ELSE.
      lr_data->zfactor = 1.
    ENDIF.

    " 数量金额方向校准
    lr_data->kwmeng_va *= lr_data->zfactor.
    lr_data->zmeng_va *= lr_data->zfactor.
    lr_data->kzwi1_va *= lr_data->zfactor.
    lr_data->lfimg_vl *= lr_data->zfactor.
    lr_data->fkimg_vf *= lr_data->zfactor.
    lr_data->kzwi1_vf *= lr_data->zfactor.

    " 税率
    _get_prcd_elements 'MWSI'.
    lr_data->ztax_rate = ls_prcd_elements-kbetr / 100. " 底表记录13，转换为0.13

    " 销售数量，对于订单，取订单数量，对于和同或服务框架之类的，取目标数量
    IF lr_data->kwmeng_va <> 0.
      lr_data->zquan2 = lr_data->kwmeng_va.
    ELSEIF lr_data->zmeng_va <> 0.
      lr_data->zquan2 = lr_data->zmeng_va.
    ENDIF.
    " 销售单价 = 数量(订单数量或目标数量) / 小计
    " 看项目实际需求，可能会取定价值，这边简单取小计值即可
    IF lr_data->zquan2 <> 0.
      lr_data->zamount1 = lr_data->kzwi1_va / lr_data->zquan2.
    ENDIF.
    " 销售含税总金额 = 小计
    lr_data->zamount3 = lr_data->kzwi1_va.

    IF lr_data->vbeln_vl IS NOT INITIAL.
      lr_data->zamount4 = lr_data->zamount1. " 交货单价 = 销售单价
      " 根据行项目过账状态判断交货数量，不会有中间状态
      IF lr_data->wbsta_vl = 'C'. " 完全交货
        lr_data->zquan5 = lr_data->lfimg_vl. " 交货数量
      ENDIF.
      lr_data->zamount6 = lr_data->zquan5 * lr_data->zamount4. " 交货含税总金额 = 交货数量 * 交货单价
      lr_data->zquan7 = lr_data->zquan2 - lr_data->zquan5. " 未交货数量 = 销售数量 - 交货数量
      lr_data->zamount8 = lr_data->zquan7 * lr_data->zamount4. " 未交货含税总金额 = 未交货数量 * 交货单价
    ENDIF.

    " 开票单价 = 数量 / 小计
    IF lr_data->fkimg_vf <> 0.
      lr_data->zamount9 = lr_data->kzwi1_vf / lr_data->fkimg_vf.
    ENDIF.
    lr_data->zquan10 = lr_data->lfimg_vl. " 开票数量
    lr_data->zamount11 = lr_data->zquan10 * lr_data->zamount9. " 开票含税总金额 = 开票数量 * 开票单价
    IF lr_data->vbeln_vl IS NOT INITIAL.
      lr_data->zquan12 = lr_data->zquan5 - lr_data->lfimg_vl. " 未开票数量 = 交货数量 - 开票数量
    ELSE.
      lr_data->zquan12 = lr_data->zquan2 - lr_data->lfimg_vl. " 未开票数量 = 销售数量 - 开票数量
    ENDIF.
    lr_data->zamount13 = lr_data->zquan12 * lr_data->zamount11. " 未交货含税总金额 = 未交货数量 * 交货单价
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_fetch_text
*&---------------------------------------------------------------------*
*& 读取文本
*&---------------------------------------------------------------------*
FORM frm_fetch_text .
  CHECK gt_data IS NOT INITIAL.

*  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
*    lr_data->kunag_text = zcl_text=>auto( lr_data->kunag ).
*    lr_data->kunnr_text = zcl_text=>auto( lr_data->kunnr ).
*    lr_data->kunre_text = zcl_text=>auto( lr_data->kunre ).
*    lr_data->kunrg_text = zcl_text=>auto( lr_data->kunrg ).
*    lr_data->maktx = zcl_text=>auto( lr_data->matnr ).
*  ENDLOOP.

ENDFORM.

```

</details>

<details>
  <summary>ALV</summary>

```ABAP

*&---------------------------------------------------------------------*
*& 包含               ZSDREPORT_ALV
*&---------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*& Form frm_display
*&---------------------------------------------------------------------*
*& 报表展示
*&---------------------------------------------------------------------*
FORM frm_display TABLES ct_data TYPE STANDARD TABLE.

  DATA ls_layout TYPE lvc_s_layo.
  DATA lt_fieldcat TYPE STANDARD TABLE OF lvc_s_fcat.

  PERFORM frm_set_layout CHANGING ls_layout.
  PERFORM frm_set_fieldcat TABLES lt_fieldcat.
  PERFORM frm_set_style.
  PERFORM frm_set_color.

  CALL FUNCTION 'REUSE_ALV_GRID_DISPLAY_LVC'
    EXPORTING
      i_callback_program      = sy-repid
*     i_callback_pf_status_set = 'FRM_PF_STATUS'
      i_callback_user_command = 'FRM_USER_COMMAND'
      is_layout_lvc           = ls_layout
      it_fieldcat_lvc         = lt_fieldcat
      i_default               = abap_true
      i_save                  = 'A'
    TABLES
      t_outtab                = ct_data[]
    EXCEPTIONS
      program_error           = 1
      OTHERS                  = 2.
  IF sy-subrc <> 0.
    MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
    WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
  ENDIF.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_layout
*&---------------------------------------------------------------------*
*& 报表布局设置
*&---------------------------------------------------------------------*
FORM frm_set_layout CHANGING cs_layout TYPE lvc_s_layo.

  CLEAR cs_layout.
  cs_layout-zebra = abap_true. " 斑马线
  cs_layout-cwidth_opt = abap_true. " 自动调整ALVL列宽
  cs_layout-sel_mode = 'A'. " 选择模式
  cs_layout-ctab_fname = 'T_SCOL'. " 单元格颜色设置
  cs_layout-stylefname = 'T_STYL'. " 单元格控制

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_fieldcat
*&---------------------------------------------------------------------*
*& 字段目录设置
*&---------------------------------------------------------------------*
FORM frm_set_fieldcat TABLES ct_fieldcat TYPE lvc_t_fcat.

  DATA ls_fieldcat TYPE lvc_s_fcat.

  DEFINE _init_fieldcat.
    CLEAR ls_fieldcat.
    ls_fieldcat-fieldname = &1.
    ls_fieldcat-tooltip =
    ls_fieldcat-coltext =
    ls_fieldcat-seltext =
    ls_fieldcat-scrtext_l =
    ls_fieldcat-scrtext_m =
    ls_fieldcat-scrtext_s = &2.
    ls_fieldcat-ref_table = &3.
    ls_fieldcat-ref_field = &4.
    INSERT ls_fieldcat INTO TABLE ct_fieldcat.
  END-OF-DEFINITION.


  _init_fieldcat 'VBELN_VA' '销售订单' 'VBAP' 'VBELN'.
  _init_fieldcat 'POSNR_VA' '销售行项目' 'VBAP' 'POSNR'.
  _init_fieldcat 'VBTYP_VA ' '凭证类型' 'VBAK' 'VBTYP'.
  _init_fieldcat 'AUART_VA ' '销售订单类型' 'VBAK' 'AUART'.
  _init_fieldcat 'VKORG_VA ' '销售组织' 'VBAK' 'VKORG'.
  _init_fieldcat 'VTWEG_VA ' '分销渠道' 'VBAK' 'VTWEG'.
  _init_fieldcat 'SPART_VA ' '产品组' 'VBAK' 'SPART'.
*  _init_fieldcat 'KWMENG_VA' '订单数量' 'VBAP' 'KWMENG'.
*  _init_fieldcat 'ZMENG_VA ' '目标数量' 'VBAP' 'ZMENG'.
  _init_fieldcat 'MEINS_VA ' '单位' 'VBAP' 'MEINS'.
*  _init_fieldcat 'KZWI1_VA ' '销售小计' 'VBAP' 'KZWI1'.
  _init_fieldcat 'WAERK_VA ' '货币' 'VBAP' 'WAERK'.
  _init_fieldcat 'KNUMV_VA ' '条件号' 'VBAK' 'KNUMV'.
*  _init_fieldcat 'KBETR_VA ' '定价值' 'PRCD_ELEMENTS' 'KBETR'.
  _init_fieldcat 'BSTKD_VA ' '客户参考' 'VBKD' 'BSTKD'.

  _init_fieldcat 'KUNAG     ' '签署方编码' 'KNA1' 'KUNNR'.
  _init_fieldcat 'KUNAG_TEXT' '签署方名称' '' ''.
  _init_fieldcat 'KUNNR     ' '送达方编码' 'KNA1' 'KUNNR'.
  _init_fieldcat 'KUNNR_TEXT' '送达方名称' '' ''.
  _init_fieldcat 'KUNRE     ' '开票方编码' 'KNA1' 'KUNNR'.
  _init_fieldcat 'KUNRE_TEXT' '开票方名称' '' ''.
  _init_fieldcat 'KUNRG     ' '付款方编码' 'KNA1' 'KUNNR'.
  _init_fieldcat 'KUNRG_TEXT' '付款方名称' '' ''.

  _init_fieldcat 'MATNR' '物料号' 'MARA' 'MATNR'.
  _init_fieldcat 'MAKTX' '物料描述' 'MAKT' 'MAKTX'.
  _init_fieldcat 'WERKS' '工厂' 'T001W' 'WERKS'.
  _init_fieldcat 'LGORT' '库位' 'T001L' 'LGORT'.
  _init_fieldcat 'POSID' 'WBS' 'PRPS' 'POSID'.
  _init_fieldcat 'CHARG' '批次' 'MCH1' 'CHARG'.

  _init_fieldcat 'VBELN_VL' '交货订单' 'LIPS' 'VBELN'.
  _init_fieldcat 'POSNR_VL' '交货行项目' 'LIPS' 'POSNR'.
  _init_fieldcat 'VBTYP_VL' '销售和分销凭证类别' 'LIKP' 'VBTYP'.
  _init_fieldcat 'LFART_VL' '交货类型' 'LIKP' 'LFART'.
  _init_fieldcat 'WADAT_IST_VL' '实际交货日期' 'LIKP' 'WADAT_IST'.
  _init_fieldcat 'UECHA_VL' '上层项目批' 'LIPS' 'UECHA'.
  _init_fieldcat 'WBSTA_VL' '交货状态' 'LIPS' 'WBSTA'.
*  _INIT_FIELDCAT 'LFIMG_VL' '交货数量' 'LIPS' 'LFIMG'.
  _init_fieldcat 'MEINS_VL' '单位' 'LIPS' 'MEINS'.

  _init_fieldcat 'VBELN_VF' '开票凭证' 'VBRP' 'VBELN'.
  _init_fieldcat 'POSNR_VF' '开票行项目' 'VBRP' 'POSNR'.
  _init_fieldcat 'VBTYP_VF' '发票凭证类别' 'VBRK' 'VBTYP'.
  _init_fieldcat 'FKDAT_VF' '开票日期' 'VBRK' 'FKDAT'.
*  _INIT_FIELDCAT 'FKIMG_VF' '开票数量' 'VBRP' 'FKIMG'.
  _init_fieldcat 'MEINS_VF' '单位' 'VBRP' 'MEINS'.
*  _INIT_FIELDCAT 'KZWI1_VF' '发票小计' 'VBRP' 'KZWI1'.
  _init_fieldcat 'WAERK_VF' '货币' 'VBRP' 'WAERK'.

  _init_fieldcat 'ZTAX_RATE' '税率' '' ''.

  _init_fieldcat 'ZAMOUNT1 ' '销售单价' '' ''.
  _init_fieldcat 'ZQUAN2   ' '销售数量' '' ''.
  _init_fieldcat 'ZAMOUNT3 ' '销售含税总金额' '' ''.

  _init_fieldcat 'ZAMOUNT4 ' '发货单价' '' ''.
  _init_fieldcat 'ZQUAN5   ' '交货数量' '' ''.
  _init_fieldcat 'ZAMOUNT6 ' '发货含税总金额' '' ''.
  _init_fieldcat 'ZQUAN7   ' '未交货数量' '' ''.
  _init_fieldcat 'ZAMOUNT8 ' '未交货含税总金额' '' ''.

  _init_fieldcat 'ZAMOUNT9 ' '开票单价' '' ''.
  _init_fieldcat 'ZQUAN10  ' '开票数量' '' ''.
  _init_fieldcat 'ZAMOUNT11' '开票含税总金额' '' ''.
  _init_fieldcat 'ZQUAN12  ' '未开票数量' '' ''.
  _init_fieldcat 'ZAMOUNT13' '未开票含税总金额' '' ''.

  " 个性化自己输出数据格式
  LOOP AT ct_fieldcat REFERENCE INTO DATA(lr_fieldcat).
    IF lr_fieldcat->fieldname = 'ZSEL'.
      lr_fieldcat->checkbox = abap_true.
    ENDIF.

    " 销售参考
    IF lr_fieldcat->fieldname = 'KWMENG_VA' " 订单数量
    OR lr_fieldcat->fieldname = 'ZMENG_VA' " 目标数量
    OR lr_fieldcat->fieldname = 'ZQUAN2' " 销售数量
    .
      lr_fieldcat->qfieldname = 'MEINS_VA'.
    ENDIF.

    IF lr_fieldcat->fieldname = 'KZWI1_VA' " 小计
    OR lr_fieldcat->fieldname = 'KBETR_VA' " 定价值
    OR lr_fieldcat->fieldname = 'ZAMOUNT1' " 销售单价
    OR lr_fieldcat->fieldname = 'ZAMOUNT3' " 销售含税总金额
    .
      lr_fieldcat->qfieldname = 'WAERK_VA'.
    ENDIF.

    " 交货参考
    IF lr_fieldcat->fieldname = 'LFIMG_VL' " 交货数量
    OR lr_fieldcat->fieldname = 'ZQUAN5' " 交货数量
    OR lr_fieldcat->fieldname = 'ZQUAN7' " 未交货数量
    .
*      lr_fieldcat->qfieldname = 'MEINS_VL'.
      lr_fieldcat->qfieldname = 'MEINS_VA'.
    ENDIF.

    IF lr_fieldcat->fieldname = 'ZAMOUNT4' " 交货单价
    OR lr_fieldcat->fieldname = 'ZAMOUNT6' " 发货含税总金额
    OR lr_fieldcat->fieldname = 'ZAMOUNT7' " 未发货含税总金额
    .
*      lr_fieldcat->qfieldname = 'WAERK_VL'.
      lr_fieldcat->qfieldname = 'WAERK_VA'.
    ENDIF.

    " 开票参考
    IF lr_fieldcat->fieldname = 'FKIMG_VF' " 开票数量
    OR lr_fieldcat->fieldname = 'ZQUAN10' " 开票数量
    OR lr_fieldcat->fieldname = 'ZQUAN12' " 未开票数量
    .
      lr_fieldcat->qfieldname = 'MEINS_VF'.
    ENDIF.

    IF lr_fieldcat->fieldname = 'KZWI1_VF' " 开票小计
    OR lr_fieldcat->fieldname = 'ZAMOUNT9' " 开票单价
    OR lr_fieldcat->fieldname = 'ZAMOUNT11' " 开票含税总金额
    OR lr_fieldcat->fieldname = 'ZAMOUNT13' " 未开票含税总金额
    .
      lr_fieldcat->qfieldname = 'WAERK_VF'.
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_style
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
FORM frm_set_style.

  DATA ls_styl TYPE lvc_s_styl.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    CLEAR lr_data->t_styl.

    " 设置ALV字段或行的状态
    " 常用有禁止编辑CL_GUI_ALV_GRID=>MC_STYLE_DISABLED
    " 禁止删除行CL_GUI_ALV_GRID=>MC_STYLE_NO_DELETE_ROW

  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_color
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
FORM frm_set_color.

  STATICS:
    BEGIN OF color,
      r_light     TYPE char04,
      r_highlight TYPE char04,
      r_success   TYPE char04,
      r_error     TYPE char04,
      light       TYPE lvc_s_scol-color,
      highlight   TYPE lvc_s_scol-color,
      success     TYPE lvc_s_scol-color,
      error       TYPE lvc_s_scol-color,
    END OF color.
  IF color IS INITIAL.
    color-r_light = 'C300'.
    color-r_highlight = 'C310'.
    color-r_success = 'C500'.
    color-r_error = 'C600'.
    color-light = VALUE #( col = 3 ).
    color-highlight = VALUE #( col = 3 int = 1 ).
    color-success = VALUE #( col = 5 ).
    color-error = VALUE #( col = 6 ).
  ENDIF.

  DATA ls_scol TYPE lvc_s_scol.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    CLEAR lr_data->t_scol.

    " 关键信息高亮显示
    lr_data->t_scol = VALUE #( BASE lr_data->t_scol color = color-light " highlight
      ( fname = 'VBELN_VA    ' ) " 销售订单号
      ( fname = 'VBELN_VF    ' ) " 开票凭证
      ( fname = 'VBELN_VL    ' ) " 交货单号
    ).

    " 关键信息高亮显示
    lr_data->t_scol = VALUE #( BASE lr_data->t_scol color = color-light
      ( fname = 'KUNAG' ) " 签署方编码
      ( fname = 'KUNNR' ) " 送达方编码
      ( fname = 'KUNRE' ) " 开票方编码
      ( fname = 'KUNRG' ) " 付款方编码

      ( fname = 'MATNR' ) " 物料号
      ( fname = 'WERKS' ) " 工厂
      ( fname = 'LGORT' ) " 库位
      ( fname = 'PSPNR' ) " WBS
      ( fname = 'POSID' ) " WBS
      ( fname = 'CHARG' ) " SAP批次号

      ( fname = 'MEINS_VA' ) " 单位
      ( fname = 'MEINS_VL' ) " 单位
      ( fname = 'MEINS_VF' ) " 单位
      ( fname = 'WAERK_VA' ) " 货币
      ( fname = 'WAERK_VL' ) " 货币
      ( fname = 'WAERK_VF' ) " 货币

      ( fname = 'KWMENG_VA' ) " 订单数量
      ( fname = 'ZMENG_VA' ) " 目标数量
      ( fname = 'KZWI1_VA' ) " 销售小计
      ( fname = 'LFIMG_VL' ) " 发货数量
      ( fname = 'FKIMG_VF' ) " 开票数量
      ( fname = 'KZWI1_VF' ) " 发票小计

      ( fname = 'ZAMOUNT1 ' ) " 销售单价
      ( fname = 'ZQUAN2   ' ) " 销售数量
      ( fname = 'ZAMOUNT3 ' ) " 销售含税总金额

      ( fname = 'ZAMOUNT4 ' ) " 发货单价
      ( fname = 'ZQUAN5   ' ) " 交货数量
      ( fname = 'ZAMOUNT6 ' ) " 发货含税总金额
      ( fname = 'ZQUAN7   ' ) " 未交货数量
      ( fname = 'ZAMOUNT8 ' ) " 未交货含税总金额

      ( fname = 'ZAMOUNT9 ' ) " 开票单价
      ( fname = 'ZQUAN10  ' ) " 开票数量
      ( fname = 'ZAMOUNT11' ) " 开票含税总金额
      ( fname = 'ZQUAN12  ' ) " 未开票数量
      ( fname = 'ZAMOUNT13' ) " 未开票含税总金额
    ).

    IF lr_data->mtype = 'E'.
      lr_data->t_scol = VALUE #( BASE lr_data->t_scol color = color-error
        ( fname = 'MTYPE' )
        ( fname = 'MSG' )
      ).
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_pf_status
*&---------------------------------------------------------------------*
*& 设置GUI状态
*&---------------------------------------------------------------------*
FORM frm_pf_status USING ct_extab TYPE slis_t_extab.

  DATA lt_excluding TYPE STANDARD TABLE OF sy-ucomm.
  SET PF-STATUS 'STATUS' EXCLUDING lt_excluding.

  DATA l_title TYPE string.
  SET TITLEBAR 'TITLE' WITH l_title.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_user_command
*&---------------------------------------------------------------------*
*& 功能响应
*&---------------------------------------------------------------------*
FORM frm_user_command USING cv_ucomm LIKE sy-ucomm
                            cs_selfield TYPE slis_selfield.

  " 刷新屏幕数据到内表
  DATA: lo_grid TYPE REF TO cl_gui_alv_grid.
  CALL FUNCTION 'GET_GLOBALS_FROM_SLVC_FULLSCR'
    IMPORTING
      e_grid = lo_grid.
  CALL METHOD lo_grid->check_changed_data.

  PERFORM frm_get_data_selection.

  " 按钮功能实现
  CASE cv_ucomm.
    WHEN '&IC1'. " 双击
      CASE cs_selfield-fieldname.
        WHEN 'MATNR'.
          SET PARAMETER ID 'MXX' FIELD 'K'.
          SET PARAMETER ID 'MAT' FIELD cs_selfield-value.
          CALL TRANSACTION 'MM03' AND SKIP FIRST SCREEN.

        WHEN 'VBELN_VA'.
          SET PARAMETER ID 'AUN' FIELD cs_selfield-value.
          CALL TRANSACTION 'VA03' AND SKIP FIRST SCREEN.

        WHEN 'VBELN_VL'.
          SET PARAMETER ID 'VL' FIELD cs_selfield-value.
          CALL TRANSACTION 'VL03N' AND SKIP FIRST SCREEN.

        WHEN 'VBELN_VF'.
          SET PARAMETER ID 'VF' FIELD cs_selfield-value.
          CALL TRANSACTION 'VF03' AND SKIP FIRST SCREEN.

      ENDCASE.

    WHEN OTHERS.
  ENDCASE.

  " 刷新ALV 显示值
  cs_selfield-refresh = abap_true .
  cs_selfield-row_stable = abap_true .
  cs_selfield-col_stable = abap_true .

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_data_selection
*&---------------------------------------------------------------------*
*& 传递侧边栏选择到ZSEL字段
*&---------------------------------------------------------------------*
FORM frm_get_data_selection.

  " 刷新屏幕数据到内表
  DATA: lo_grid TYPE REF TO cl_gui_alv_grid.
  CALL FUNCTION 'GET_GLOBALS_FROM_SLVC_FULLSCR'
    IMPORTING
      e_grid = lo_grid.

  " 获取ALV选取行
  DATA lt_rows TYPE lvc_t_row.
  CALL METHOD lo_grid->get_selected_rows
    IMPORTING
      et_index_rows = lt_rows.

  LOOP AT lt_rows INTO DATA(ls_row).
    READ TABLE gt_data REFERENCE INTO DATA(lr_data) INDEX ls_row-index.
    IF sy-subrc = 0.
      lr_data->zsel = abap_true.
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_reset_data_selection
*&---------------------------------------------------------------------*
*& 取消全部勾选
*&---------------------------------------------------------------------*
FORM frm_reset_data_selection.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    CLEAR lr_data->zsel.
  ENDLOOP.

ENDFORM.

```

</details>
