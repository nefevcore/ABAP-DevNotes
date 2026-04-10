# 固定资产明细报表

<details>
  <summary>主程序</summary>

```ABAP

*&---------------------------------------------------------------------*
*& 作者     Nefvcore
*& 创建日期 2022年8月23日
*& 描述     固定资产明细报表
*&---------------------------------------------------------------------*
REPORT zfixed_assets.

INCLUDE zfir017_top.
INCLUDE zfir017_sel.
INCLUDE zfir017_frm.
INCLUDE zfir017_alv.

START-OF-SELECTION.
  PERFORM frm_main.

```

</details>

<details>
  <summary>全局参数</summary>

```ABAP

TYPES: ty_amount TYPE p LENGTH 16 DECIMALS 2. " P值上限
TYPES:
  BEGIN OF ty_data,
    bukrs              TYPE anla-bukrs  , " 公司代码
    butxt              TYPE t001-butxt  , " 公司代码描述
    anln1              TYPE anla-anln1  , " 资产主号
    anln2              TYPE anla-anln2  , " 资产子号
    txt50              TYPE anla-txt50  , " 资产描述一
    txa50              TYPE anla-txa50  , " 资产描述二
    anlhtxt            TYPE anlh-anlhtxt, " 资产主号文本
    sernr              TYPE anla-sernr  , " 序列号
    invnr              TYPE anla-invnr  , " 存货号
    invzu              TYPE anla-invzu  , " 库存注记
    anlkl              TYPE anla-anlkl  , " 资产分类
    anlkl_text         TYPE ankt-txk20  , " 资产分类描述
    aktiv              TYPE anla-aktiv  , " 资本化日期
    deakt              TYPE anla-deakt  , " 不活动日期
    kostl              TYPE anlz-kostl  , " 成本中心
    kostl_text         TYPE cskt-ktext  , " 成本中心描述
    kostlv             TYPE anlz-kostlv , " 责任成本中心
    kostlv_text        TYPE cskt-ktext  , " 责任成本中心描述
    werks              TYPE anlz-werks  , " 工厂
    stort              TYPE anlz-stort  , " 位置
    stort_text         TYPE t499s-ktext , " 位置描述
    raumn              TYPE anlz-raumn  , " 使用人
    ord41              TYPE anla-ord41  , " 资产状态
    ordtx              TYPE t087t-ordtx , " 资产状态描述
    equnr              TYPE v_equi-equnr, " 设备号
    eqktx              TYPE v_equi-eqktx, " 设备描述
    liefe              TYPE anla-liefe  , " 供应商
    herst              TYPE anla-herst  , " 制造商
    afasl              TYPE anlb-afasl  , " 折旧码
    months_valid       TYPE i, " 使用月限
    months_accrued     TYPE i, " 已计提折旧月份
    afabg              TYPE anlb-afabg, " 折旧开始日期
    ori_year_begin     TYPE ty_amount, " 年初资产原值
    ori_year_changed   TYPE ty_amount, " 本年资产价值变更
    ori_year_end       TYPE ty_amount, " 期末资产原值
    dep_year_begin     TYPE ty_amount, " 年初资产累计折旧
    dep_year_accrual   TYPE ty_amount, " 本年资产计提折旧
    dep_period_accrual TYPE ty_amount, " 本月资产计提折旧
    dep_year_changed   TYPE ty_amount, " 本年折旧价值变更
    dep_year_end       TYPE ty_amount, " 期末累计折旧
    amount             TYPE ty_amount, " 净值

    adatu              TYPE anlz-adatu, " 资产起始日期
    bdatu              TYPE anlz-bdatu, " 资产结束日期

    ndjar              TYPE anlb-ndjar, " 使用年限
    ndper              TYPE anlb-ndper, " 期间

    zsel               TYPE xfeld,
    mtype              TYPE bapi_mtype,
    msg                TYPE bapi_msg,
    t_scol             TYPE lvc_t_scol,
  END OF ty_data.
TYPES tt_data TYPE STANDARD TABLE OF ty_data WITH EMPTY KEY.

DATA gt_data TYPE tt_data.

```

</details>

<details>
  <summary>屏幕定义</summary>

```ABAP

TABLES anla.
TABLES anlb.
TABLES anlz.
SELECT-OPTIONS s_bukrs FOR anla-bukrs OBLIGATORY.
SELECT-OPTIONS s_anlkl FOR anla-anlkl DEFAULT '1100' TO '9000'.
SELECT-OPTIONS s_anln1 FOR anla-anln1.
SELECT-OPTIONS s_kostl FOR anlz-kostl.
SELECT-OPTIONS s_kostlv FOR anlz-kostlv.
SELECT-OPTIONS s_ord41 FOR anla-ord41.
PARAMETERS p_adatu TYPE sy-datum OBLIGATORY DEFAULT sy-datum.
SELECT-OPTIONS s_afabe FOR anlb-afabe OBLIGATORY
    NO INTERVALS NO-EXTENSION.

```

</details>

<details>
  <summary>子例程</summary>

```ABAP

*&---------------------------------------------------------------------*
*& Form frm_main
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
FORM frm_main .

  PERFORM frm_auth_check.
  PERFORM frm_get_data.
  IF gt_data IS INITIAL.
    MESSAGE '无数据' TYPE 'S' DISPLAY LIKE 'E'.
    RETURN.
  ENDIF.

  PERFORM frm_get_ord41. " 资产状态
  PERFORM frm_get_equi. " 设备
  PERFORM frm_get_amount. " 原值和折旧金额
  PERFORM frm_get_text. " 文本取值

  PERFORM frm_display TABLES gt_data[].

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_auth_check
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
*& -->  p1        text
*& <--  p2        text
*&---------------------------------------------------------------------*
FORM frm_auth_check .

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_data
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
*& -->  p1        text
*& <--  p2        text
*&---------------------------------------------------------------------*
FORM frm_get_data .

  SELECT
    anla~bukrs,
    anla~anln1,
    anla~anln2,
    anla~txt50,
    anla~txa50,
    anla~sernr,
    anla~invnr,
    anla~invzu,
    anla~anlkl,
    anla~ord41,
    anla~aktiv,
    anla~deakt,
    anla~liefe,
    anla~herst,
    anlb~afasl,
    anlb~ndjar,
    anlb~ndper,
    anlb~afabg,
    anlz~kostl,
    anlz~kostlv,
    anlz~werks,
    anlz~stort,
    anlz~raumn,
    anlz~adatu,
    anlz~bdatu
    FROM anla
    LEFT JOIN anlb ON anla~bukrs = anlb~bukrs
                  AND anla~anln1 = anlb~anln1
                  AND anla~anln2 = anlb~anln2
    LEFT JOIN anlz ON anla~bukrs = anlz~bukrs
                  AND anla~anln1 = anlz~anln1
                  AND anla~anln2 = anlz~anln2
    WHERE anla~bukrs IN @s_bukrs
      AND anla~anln1 IN @s_anln1
      AND anla~anlkl IN @s_anlkl
      AND anla~ord41 IN @s_ord41
      AND anlb~afabe IN @s_afabe
      AND anlz~kostl IN @s_kostl
      AND anlz~kostlv IN @s_kostlv
    INTO CORRESPONDING FIELDS OF TABLE @gt_data.

  " 查询日期
  IF p_adatu IS NOT INITIAL.
    DELETE gt_data WHERE adatu > p_adatu OR bdatu < p_adatu.
  ENDIF.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    lr_data->months_valid = lr_data->ndjar * 12 + lr_data->ndper. " 使用月限
    " 已计提折旧月份
    DATA l_date_from TYPE datum.
    DATA l_date_to TYPE datum.
    DATA l_months TYPE vtbbewe-atage.

    l_date_to = |{ p_adatu(6) }01|.
    l_date_from = |{ lr_data->afabg(6) }01|.

    IF l_date_from < l_date_to.
      CALL FUNCTION 'FIMA_DAYS_AND_MONTHS_AND_YEARS'
        EXPORTING
          i_date_from = l_date_from
          i_date_to   = l_date_to
        IMPORTING
          e_months    = l_months.
      l_months = l_months + 1.
    ELSE.
      l_months = 1.
    ENDIF.

    " 取最小值
    IF lr_data->months_valid > l_months.
      lr_data->months_accrued = l_months.
    ELSE.
      lr_data->months_accrued = lr_data->months_valid.
    ENDIF.

  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_ORD41
*&---------------------------------------------------------------------*
*& 从历史修改记录表中查找资产状态
*& 查找失败默认取主数据ORD41的值
*&---------------------------------------------------------------------*
FORM frm_get_ord41.

  CHECK gt_data IS NOT INITIAL.

  SELECT
    ds~bukrs,
    ds~anln1,
    ds~anln2,
    cdhdr~udate,
    cdpos~value_new
    FROM @gt_data AS ds
    JOIN cdhdr ON cdhdr~objectid = 'ANLA'
              AND concat( concat( ds~bukrs, ds~anln1 ), ds~anln2 ) = cdhdr~objectid
              AND cdhdr~udate > @p_adatu
    JOIN cdpos ON cdhdr~objectclas = cdpos~objectclas
              AND cdhdr~objectid = cdpos~objectid
              AND cdhdr~changenr = cdpos~changenr
              AND cdpos~fname = 'ORD41'
    INTO TABLE @DATA(lt_record).

  " 按最近修改日期排序
  SORT lt_record BY bukrs
                    anln1
                    anln2
                    udate DESCENDING.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    READ TABLE lt_record INTO DATA(ls_record) WITH KEY
    bukrs = lr_data->bukrs
    anln1 = lr_data->anln1
    anln2 = lr_data->anln2
    BINARY SEARCH.
    IF sy-subrc = 0.
      lr_data->ord41 = ls_record-value_new.
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_equi
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
FORM frm_get_equi.

  CHECK gt_data IS NOT INITIAL.

  SELECT
    bukrs,
    anlnr,
    anlun,
    equnr,
    eqktx
    FROM v_equi
    FOR ALL ENTRIES IN @gt_data
    WHERE bukrs = @gt_data-bukrs
      AND anlnr = @gt_data-anln1
      AND anlun = @gt_data-anln2
    INTO TABLE @DATA(lt_equi).

  SORT lt_equi BY bukrs anlnr anlun.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    READ TABLE lt_equi INTO DATA(ls_equi) WITH KEY
    bukrs = lr_data->bukrs
    anlnr = lr_data->anln1
    anlun = lr_data->anln2
    BINARY SEARCH.
    IF sy-subrc = 0.
      lr_data->equnr = ls_equi-equnr.
      lr_data->eqktx = ls_equi-eqktx.
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_amount
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
FORM frm_get_amount.

  CHECK gt_data IS NOT INITIAL.

  DATA l_date_from TYPE datum.
  DATA l_date_to TYPE datum.

  l_date_from = |{ p_adatu(4) }0101|.
  l_date_to = p_adatu.

  " 资产值字段
  SELECT
    bukrs,
    anln1,
    anln2,
    gjahr,
    afabe,
    zujhr,
    zucod,
    kansw,
    knafa,
    ksafa,
    kaafa
    FROM anlc
    FOR ALL ENTRIES IN @gt_data
    WHERE bukrs = @gt_data-bukrs
      AND anln1 = @gt_data-anln1
      AND anln2 = @gt_data-anln2
      AND gjahr = @p_adatu(4)
      AND afabe IN @s_afabe
    INTO TABLE @DATA(lt_anlc).
  SORT lt_anlc BY bukrs anln1 anln2.

  " 资产期间价值
  SELECT
    bukrs,
    gjahr,
    peraf,
    afbnr,
    anln1,
    anln2,
    afaber,
    zujhr,
    zucod,
    nafaz,
    safaz,
    aafaz
    FROM anlp
    FOR ALL ENTRIES IN @gt_data
    WHERE bukrs = @gt_data-bukrs
      AND anln1 = @gt_data-anln1
      AND anln2 = @gt_data-anln2
      AND gjahr = @p_adatu(4)
      AND peraf <= @p_adatu+4(2)
      AND afaber IN @s_afabe
    INTO TABLE @DATA(lt_anlp).
  SORT lt_anlp BY bukrs anln1 anln2.

  " 资产原值抬头凭证
  IF l_date_from <= l_date_to.
    SELECT
      bukrs,
      anln1,
      anln2,
      gjahr,
      lnran
      FROM anek
      FOR ALL ENTRIES IN @gt_data
      WHERE bukrs = @gt_data-bukrs
        AND anln1 = @gt_data-anln1
        AND anln2 = @gt_data-anln2
        AND budat BETWEEN @l_date_from AND @l_date_to
      INTO TABLE @DATA(lt_anek_ori).
    SORT lt_anek_ori BY bukrs anln1 anln2.
  ENDIF.

  " 资产原值凭证行项目
  IF lt_anek_ori IS NOT INITIAL.
    " 资产业务类型
    DATA lt_bwasl_opt TYPE RANGE OF tabw-bwasl.
    SELECT
      'I' AS sign,
      'EQ' AS option,
      bwasl AS low
      FROM tabw
      JOIN tabwg ON tabw~bwagrp = tabwg~bwagrp
                AND tabwg~bwatyp <> '4'
                AND tabwg~xbnafa <> 'X'
      INTO TABLE @lt_bwasl_opt
      GROUP BY bwasl.

    " 资产行项目
    IF lt_bwasl_opt IS NOT INITIAL.
      SELECT
        bukrs,
        anln1,
        anln2,
        gjahr,
        lnran,
        anbtr
        FROM anep
        FOR ALL ENTRIES IN @lt_anek_ori
        WHERE bukrs = @lt_anek_ori-bukrs
          AND anln1 = @lt_anek_ori-anln1
          AND anln2 = @lt_anek_ori-anln2
          AND gjahr = @lt_anek_ori-gjahr
          AND lnran = @lt_anek_ori-lnran
          AND bwasl IN @lt_bwasl_opt
          AND afabe IN @s_afabe
        INTO TABLE @DATA(lt_anep_ori).
      SORT lt_anep_ori BY bukrs anln1 anln2 gjahr lnran.
    ENDIF.
  ENDIF.

  " 资产折旧抬头凭证
  IF l_date_from <= l_date_to.
    SELECT
      bukrs,
      anln1,
      anln2,
      gjahr,
      lnran
      FROM anek
      FOR ALL ENTRIES IN @gt_data
      WHERE bukrs = @gt_data-bukrs
        AND anln1 = @gt_data-anln1
        AND anln2 = @gt_data-anln2
        AND gjahr = @p_adatu(4)
        AND monat <= @p_adatu+4(2)
      INTO TABLE @DATA(lt_anek_dep).
    SORT lt_anek_dep BY bukrs anln1 anln2.

    " 资产原值凭证行项目
    IF lt_anek_dep IS NOT INITIAL.
      " 资产行项目
      SELECT
        bukrs,
        anln1,
        anln2,
        gjahr,
        lnran,
        afabe,
        zujhr,
        zucod,
        nafal,
        safal,
        aafal,
        nafav,
        safav,
        aafav,
        aufnv
        FROM anea
        FOR ALL ENTRIES IN @lt_anek_dep
        WHERE bukrs = @lt_anek_dep-bukrs
          AND anln1 = @lt_anek_dep-anln1
          AND anln2 = @lt_anek_dep-anln2
          AND gjahr = @lt_anek_dep-gjahr
          AND lnran = @lt_anek_dep-lnran
          AND afabe IN @s_afabe
        INTO TABLE @DATA(lt_anea_dep).
      SORT lt_anea_dep BY bukrs anln1 anln2 gjahr lnran.
    ENDIF.
  ENDIF.

  " 逐资产处理
  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    " 年初值
    READ TABLE lt_anlc TRANSPORTING NO FIELDS WITH KEY
    bukrs = lr_data->bukrs
    anln1 = lr_data->anln1
    anln2 = lr_data->anln2
    BINARY SEARCH.
    IF sy-subrc = 0.
      LOOP AT lt_anlc INTO DATA(ls_anlc) FROM sy-tabix.
        IF ls_anlc-bukrs <> lr_data->bukrs
        OR ls_anlc-anln1 <> lr_data->anln1
        OR ls_anlc-anln2 <> lr_data->anln2.
          EXIT.
        ENDIF.
        " 年初资产原值
        lr_data->ori_year_begin += ls_anlc-kansw.
        " 年初资产累计折旧
        lr_data->dep_year_begin += ( ls_anlc-knafa
                                   + ls_anlc-ksafa
                                   + ls_anlc-kaafa
                                   ) * -1.
      ENDLOOP.
    ENDIF.

    " 期间值
    READ TABLE lt_anlp TRANSPORTING NO FIELDS WITH KEY
    bukrs = lr_data->bukrs
    anln1 = lr_data->anln1
    anln2 = lr_data->anln2
    BINARY SEARCH.
    IF sy-subrc = 0.
      LOOP AT lt_anlp INTO DATA(ls_anlp) FROM sy-tabix.
        IF ls_anlp-bukrs <> lr_data->bukrs
        OR ls_anlp-anln1 <> lr_data->anln1
        OR ls_anlp-anln2 <> lr_data->anln2.
          EXIT.
        ENDIF.
        " 本年资产计提折旧
        lr_data->dep_year_accrual += ( ls_anlp-nafaz
                                     + ls_anlp-safaz
                                     + ls_anlp-aafaz
                                     ) * -1.

        " 本月资产计提折旧
        IF ls_anlp-peraf = p_adatu+4(2).
          lr_data->dep_period_accrual += ( ls_anlp-nafaz
                                         + ls_anlp-safaz
                                         + ls_anlp-aafaz
                                         ) * -1.
        ENDIF.
      ENDLOOP.
    ENDIF.

    " 资产行项目
    READ TABLE lt_anep_ori TRANSPORTING NO FIELDS WITH KEY
    bukrs = lr_data->bukrs
    anln1 = lr_data->anln1
    anln2 = lr_data->anln2
    BINARY SEARCH.
    IF sy-subrc = 0.
      LOOP AT lt_anep_ori INTO DATA(ls_anep_ori) FROM sy-tabix.
        IF ls_anep_ori-bukrs <> lr_data->bukrs
        OR ls_anep_ori-anln1 <> lr_data->anln1
        OR ls_anep_ori-anln2 <> lr_data->anln2.
          EXIT.
        ENDIF.
        " 本年资产价值变更
        lr_data->ori_year_changed += ls_anep_ori-anbtr.
      ENDLOOP.
    ENDIF.

    " 资产行项目
    READ TABLE lt_anea_dep TRANSPORTING NO FIELDS WITH KEY
    bukrs = lr_data->bukrs
    anln1 = lr_data->anln1
    anln2 = lr_data->anln2
    BINARY SEARCH.
    IF sy-subrc = 0.
      LOOP AT lt_anea_dep INTO DATA(ls_anea_dep) FROM sy-tabix.
        IF ls_anea_dep-bukrs <> lr_data->bukrs
        OR ls_anea_dep-anln1 <> lr_data->anln1
        OR ls_anea_dep-anln2 <> lr_data->anln2.
          EXIT.
        ENDIF.
        " 本年折旧价值变更
        lr_data->dep_year_changed += ( ls_anea_dep-nafal
                                     + ls_anea_dep-safal
                                     + ls_anea_dep-aafal
                                     + ls_anea_dep-nafav
                                     + ls_anea_dep-safav
                                     + ls_anea_dep-aafav
                                     + ls_anea_dep-aufnv
                                     ) * -1.
      ENDLOOP.
    ENDIF.

    " 期末资产原值
    lr_data->ori_year_end = lr_data->ori_year_begin
                          + lr_data->ori_year_changed.

    " 期末累计折旧
    lr_data->dep_year_end = lr_data->dep_year_begin
                          + lr_data->dep_year_accrual
                          + lr_data->dep_year_changed.

    " 净值
    lr_data->amount = lr_data->ori_year_end
                    - lr_data->dep_year_end.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_text
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
FORM frm_get_text.

  CHECK gt_data IS NOT INITIAL.

  SELECT
    bukrs,
    anln1,
    luntn,
    anlhtxt
    FROM anlh
    FOR ALL ENTRIES IN @gt_data
    WHERE bukrs = @gt_data-bukrs
      AND anln1 = @gt_data-anln1
      AND luntn = @gt_data-anln2
    INTO TABLE @DATA(lt_anlh).
  SORT lt_anlh BY bukrs anln1 luntn.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    lr_data->butxt = zcl_text=>bukrs->get( lr_data->bukrs ). " 公司代码描述

    READ TABLE lt_anlh INTO DATA(ls_anlh) WITH KEY " 资产主号文本
    bukrs = lr_data->bukrs
    anln1 = lr_data->anln1
    luntn = lr_data->anln2
    BINARY SEARCH.
    IF sy-subrc = 0.
      lr_data->anlhtxt = ls_anlh-anlhtxt.
    ENDIF.

    " 资产分类描述
    SELECT SINGLE txk20 FROM ankt
      WHERE spras = @sy-langu
        AND anlkl = @lr_data->anlkl
      INTO @lr_data->anlkl_text.

    " 成本中心描述
    SELECT SINGLE ktext FROM cskt
      WHERE spras = @sy-langu
        AND kokrs = 'NBOC'
        AND kostl = @lr_data->kostl
      INTO @lr_data->kostl_text.

    " 责任成本中心描述
    SELECT SINGLE ktext FROM cskt
      WHERE spras = @sy-langu
        AND kokrs = 'NBOC'
        AND kostl = @lr_data->kostlv
      INTO @lr_data->kostlv_text.

    " 位置描述
    SELECT SINGLE ktext FROM t499s
      WHERE werks = @lr_data->werks
        AND stand = @lr_data->stort
      INTO @lr_data->stort_text.

    " 资产状态描述
    SELECT SINGLE ordtx FROM t087t
      WHERE spras = @sy-langu
        AND ordnr = '1'
        AND ord4x = @lr_data->ord41
      INTO @lr_data->ordtx.
  ENDLOOP.

ENDFORM.

```

</details>

<details>
  <summary>ALV代码</summary>

```ABAP

*&---------------------------------------------------------------------*
*& Form frm_display
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
*& -->  p1        text
*& <--  p2        text
*&---------------------------------------------------------------------*
FORM frm_display TABLES ct_data TYPE STANDARD TABLE.

  DATA ls_layout TYPE lvc_s_layo.
  DATA lt_fieldcat TYPE STANDARD TABLE OF lvc_s_fcat.

  PERFORM frm_set_layout CHANGING ls_layout.
  PERFORM frm_set_fieldcat TABLES lt_fieldcat.
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

  _init_fieldcat 'BUKRS           ' '公司代码' 'T001' 'BUKRS'.
  _init_fieldcat 'BUTXT           ' '公司代码描述' 'T001' 'BUTXT'.
  _init_fieldcat 'ANLN1           ' '资产主号' 'ANLA' 'ANLN1'.
  _init_fieldcat 'ANLN2           ' '资产子号' 'ANLA' 'ANLN2'.
  _init_fieldcat 'TXT50           ' '资产描述一 ' 'ANLA' 'TXT50'.
  _init_fieldcat 'TXA50           ' '资产描述二 ' 'ANLA' 'TXA50'.
  _init_fieldcat 'ANLHTXT         ' '资产主号文本' 'ANLH' 'ANLHTXT'.
  _init_fieldcat 'SERNR           ' '序列号' 'ANLA' 'SERNR'.
  _init_fieldcat 'INVNR           ' '存货号' 'ANLA' 'INVNR'.
  _init_fieldcat 'INVZU           ' '库存注记' 'ANLA' 'INVZU'.
  _init_fieldcat 'ANLKL           ' '资产分类' 'ANLA' 'ANLKL'.
  _init_fieldcat 'ANLKL_TEXT      ' '资产分类描述' 'ANKT' 'TXK20'.
  _init_fieldcat 'AKTIV           ' '资本化日期' 'ANLA' 'AKTIV'.
  _init_fieldcat 'DEAKT           ' '不活动日期' 'ANLA' 'DEAKT'.
  _init_fieldcat 'KOSTL           ' '成本中心' 'ANLZ' 'KOSTL'.
  _init_fieldcat 'KOSTL_TEXT      ' '成本中心描述' 'CSKT' 'KTEXT'.
  _init_fieldcat 'KOSTLV          ' '责任成本中心' 'ANLZ' 'KOSTLV'.
  _init_fieldcat 'KOSTLV_TEXT     ' '责任成本中心描述 ' 'CSKT' 'KTEXT'.
  _init_fieldcat 'WERKS           ' '工厂' 'ANLZ' 'WERKS'.
  _init_fieldcat 'STORT           ' '位置' 'ANLZ' 'STORT'.
  _init_fieldcat 'STORT_TEXT      ' '位置描述' 'T499S' 'KTEXT'.
  _init_fieldcat 'RAUMN           ' '使用人' 'ANLZ' 'RAUMN'.
  _init_fieldcat 'ORD41           ' '资产状态' 'ANLA' 'ORD41'.
  _init_fieldcat 'ORDTX           ' '资产状态描述' 'T087T' 'ORDTX'.
  _init_fieldcat 'EQUNR           ' '设备号' 'V_EQUI' 'EQUNR'.
  _init_fieldcat 'EQKTX           ' '设备描述' 'V_EQUI' 'EQKTX'.
  _init_fieldcat 'LIEFE           ' '供应商' 'ANLA' 'LIEFE'.
  _init_fieldcat 'HERST           ' '制造商' 'ANLA' 'HERST'.
  _init_fieldcat 'AFASL           ' '折旧码' 'ANLB' 'AFASL'.
  _init_fieldcat 'MONTHS_VALID    ' '使用月限' '' ''.
  _init_fieldcat 'MONTHS_ACCRUED  ' '已计提折旧月份' '' ''.
  _init_fieldcat 'AFABG           ' '折旧开始日期' 'ANLB' 'AFABG'.
  _init_fieldcat 'ORI_YEAR_BEGIN  ' '年初资产原值' '' ''.
  _init_fieldcat 'ORI_YEAR_CHANGED' '本年资产价值变更 ' '' ''.
  _init_fieldcat 'DEP_YEAR_BEGIN  ' '年初资产累计折旧' '' ''.
  _init_fieldcat 'DEP_YEAR_ACCRUAL' '本年资产计提折旧' '' ''.
  _init_fieldcat 'DEP_PERIOD_ACCRUAL' '本月资产计提折旧' '' ''.
  _init_fieldcat 'DEP_YEAR_CHANGED' '本年折旧价值变更' '' ''.
  _init_fieldcat 'ORI_YEAR_END    ' '期末资产原值' '' ''.
  _init_fieldcat 'DEP_YEAR_END    ' '期末累计折旧' '' ''.
  _init_fieldcat 'AMOUNT          ' '净值' '' ''.

  " 个性化自己输出数据格式
  LOOP AT ct_fieldcat REFERENCE INTO DATA(lr_fieldcat).
    " 字段显示属性设置
    CASE lr_fieldcat->fieldname .
      WHEN OTHERS.
    ENDCASE.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_set_color
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
*& -->  p1        text
*& <--  p2        text
*&---------------------------------------------------------------------*
FORM frm_set_color.

  DATA ls_scol TYPE lvc_s_scol.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    CLEAR lr_data->t_scol.
    CASE lr_data->mtype.
      WHEN 'S'.
        CLEAR ls_scol.
        ls_scol-fname = 'MTYPE'.
        ls_scol-color = VALUE #( col = '5' ).
        INSERT ls_scol INTO TABLE lr_data->t_scol.
      WHEN 'E'.
        CLEAR ls_scol.
        ls_scol-fname = 'MTYPE'.
        ls_scol-color = VALUE #( col = '6' ).
        INSERT ls_scol INTO TABLE lr_data->t_scol.
    ENDCASE.

  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_pf_status
*&---------------------------------------------------------------------*
*& 设置GUI状态
*&---------------------------------------------------------------------*
FORM frm_pf_status USING ct_extab TYPE slis_t_extab.
  SET PF-STATUS 'STATUS'.
  SET TITLEBAR 'TITLE'.
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
      READ TABLE gt_data INTO DATA(ls_data) INDEX cs_selfield-tabindex.
      IF sy-subrc = 0.
        CASE cs_selfield-fieldname.
          WHEN 'ANLN1'.
            SET PARAMETER ID 'BUK' FIELD ls_data-bukrs.
            SET PARAMETER ID 'AN1' FIELD ls_data-anln1.
            CALL TRANSACTION 'AW01N'.
          WHEN OTHERS.
        ENDCASE.
      ENDIF.
    WHEN OTHERS.
      RETURN.
  ENDCASE.

  PERFORM frm_reset_data_selection.
  PERFORM frm_set_color.

  " 刷新ALV 显示值
  cs_selfield-refresh = abap_true .
  cs_selfield-row_stable = abap_true .
  cs_selfield-col_stable = abap_true .

ENDFORM.
*&---------------------------------------------------------------------*
*& Form frm_get_data_selection
*&---------------------------------------------------------------------*
*& text
*&---------------------------------------------------------------------*
*& -->  p1        text
*& <--  p2        text
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
*& text
*&---------------------------------------------------------------------*
*& -->  p1        text
*& <--  p2        text
*&---------------------------------------------------------------------*
FORM frm_reset_data_selection.

  LOOP AT gt_data REFERENCE INTO DATA(lr_data).
    CLEAR lr_data->zsel.
  ENDLOOP.

ENDFORM.

```

</details>
