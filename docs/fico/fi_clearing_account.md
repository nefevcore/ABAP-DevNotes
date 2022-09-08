# 清账

清账主要使用标准函数来处理：

- ***POSTING_INTERFACE_START***

- ***POSTING_INTERFACE_CLEARING***

- ***POSTING_INTERFACE_END***

我收集并分析了几份代码，将主要功能整理到下面代码，可以根据自己需要进行扩展：

<details>
  <summary>LCL_CLEARING_ACCOUNT</summary>

```ABAP
*&---------------------------------------------------------------------*
*& 客户清账（F-32）、供应商清账（F-44）代码封装
*& 按我理解，清账开发一般有两种情况
*& 1. 部分付款清账
*&    这种清账会保留原凭证，有可能出现一张凭证多次付款的情况，
*&    因此部分付款的清账方式应用也不多，下面代码没考虑（以后遇到再补充）
*& 2. 剩余清账
*&    该方式清账后，原凭证消失，然后生成一张无凭证行或包括一行差额
*&    行的清账凭证，下面代码主要处理这种清账方式。
*&---------------------------------------------------------------------*
CLASS lcl_clearing_account DEFINITION DEFERRED.

*&---------------------------------------------------------------------*
*& lcl_clearing_account
*&---------------------------------------------------------------------*
CLASS lcl_clearing_account DEFINITION CREATE PRIVATE.
  PUBLIC SECTION.
*&---------------------------------------------------------------------*
*& 需要清账的凭证行
*&---------------------------------------------------------------------*
    TYPES:
      BEGIN OF ty_clearing_line,
        bukrs TYPE bseg-bukrs,
        belnr TYPE bseg-belnr,
        gjahr TYPE bseg-gjahr,
        buzei TYPE bseg-buzei,
      END OF ty_clearing_line.
    TYPES tt_clearing_line TYPE STANDARD TABLE OF ty_clearing_line WITH EMPTY KEY.
*&---------------------------------------------------------------------*
*& 清账结果
*&---------------------------------------------------------------------*
    TYPES:
      BEGIN OF ty_result,
        mtype TYPE bapi_mtype,
        msg   TYPE bapi_msg,
        belnr TYPE belnr,
      END OF ty_result.
*&---------------------------------------------------------------------*
*& class_constructor
*&---------------------------------------------------------------------*
    CLASS-METHODS class_constructor.
*&---------------------------------------------------------------------*
*& 客户清账
*&---------------------------------------------------------------------*
    CLASS-METHODS post_f_32
      IMPORTING i_bukrs          TYPE bukrs
                i_kunnr          TYPE kunnr
                it_clearing_line TYPE tt_clearing_line
      RETURNING VALUE(result)    TYPE ty_result.
*&---------------------------------------------------------------------*
*& 供应商清账
*&---------------------------------------------------------------------*
    CLASS-METHODS post_f_44
      IMPORTING i_bukrs          TYPE bukrs
                i_lifnr          TYPE lifnr OPTIONAL
                it_clearing_line TYPE tt_clearing_line
      RETURNING VALUE(result)    TYPE ty_result.

  PRIVATE SECTION.
*&---------------------------------------------------------------------*
*& 清账记账码配置
*&---------------------------------------------------------------------*
    CLASS-DATA ms_t041a TYPE t041a.
*&---------------------------------------------------------------------*
*& 标准清账方法参数
*&---------------------------------------------------------------------*
    DATA:
      mt_ftclear TYPE STANDARD TABLE OF ftclear,
      mt_ftpost  TYPE STANDARD TABLE OF ftpost,
      mt_blntab  TYPE STANDARD TABLE OF blntab,
      mt_fttax   TYPE STANDARD TABLE OF fttax.
*&---------------------------------------------------------------------*
*& 中间参数
*&---------------------------------------------------------------------*
    DATA m_bukrs TYPE bukrs. " 公司代码
    DATA m_koart TYPE koart. " 账户类型
    DATA m_hkont TYPE hkont. " （客商）科目
    DATA mt_bseg TYPE STANDARD TABLE OF bseg. " 清账行
    DATA ms_result TYPE ty_result. " 清账结果
*&---------------------------------------------------------------------*
*& 根据入参确定记账码
*& （复制标准程序MF05AFA0_AUSGLEICH_ZAHLUNGSD04里面的代码）
*&---------------------------------------------------------------------*
    CLASS-METHODS determine_posting_key
      IMPORTING i_koart        TYPE koart " 账户类型
                i_umsks        TYPE umsks " 特殊总账
                i_amount_diff  TYPE p " 差值
      RETURNING VALUE(r_bschl) TYPE bschl. " 过账码.
*&---------------------------------------------------------------------*
*& 获取客户未清数据
*&---------------------------------------------------------------------*
    METHODS get_bsid
      IMPORTING it_clearing_line TYPE tt_clearing_line.
*&---------------------------------------------------------------------*
*& 获取供应商未清数据
*&---------------------------------------------------------------------*
    METHODS get_bsik
      IMPORTING it_clearing_line TYPE tt_clearing_line.
*&---------------------------------------------------------------------*
*& 调用标准方法POSTING_INTERFACE_CLEARING进行清账
*&---------------------------------------------------------------------*
    METHODS posting_before.
    METHODS posting_interface.
ENDCLASS.

*&---------------------------------------------------------------------*
*& lcl_clearing_account
*&---------------------------------------------------------------------*
CLASS lcl_clearing_account IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& class_constructor
*&---------------------------------------------------------------------*
  METHOD class_constructor.

    " AUGLV对应FB05要处理的业务
    " UMBUCHNG, Transfer posting with clearing, 转账并清账
    SELECT SINGLE * FROM t041a WHERE auglv = 'UMBUCHNG' INTO @ms_t041a.

  ENDMETHOD.

*&---------------------------------------------------------------------*
*& 根据入参确定记账码
*& （复制标准程序MF05AFA0_AUSGLEICH_ZAHLUNGSD04里面的代码）
*& 标准代码里面还有剩余清账的记账码取值逻辑，我这里用不到，先不写
*&---------------------------------------------------------------------*
  METHOD determine_posting_key.

    CASE i_koart.
      WHEN 'D'.
        IF i_amount_diff < 0.
          IF i_umsks = space.
            r_bschl = ms_t041a-rpdha.
          ELSE.
            r_bschl = ms_t041a-bsdhs.
          ENDIF.
        ELSE.
          IF i_umsks = space.
            r_bschl = ms_t041a-rpdso.
          ELSE.
            r_bschl = ms_t041a-bsdss.
          ENDIF.
        ENDIF.
      WHEN 'K'.
        IF i_amount_diff < 0.
          IF i_umsks = space.
            r_bschl = ms_t041a-rpkha.
          ELSE.
            r_bschl = ms_t041a-bskhs.
          ENDIF.
        ELSE.
          IF i_umsks = space.
            r_bschl = ms_t041a-rpkso.
          ELSE.
            r_bschl = ms_t041a-bskss.
          ENDIF.
        ENDIF.
      WHEN 'S'.
        IF i_amount_diff < 0.
          r_bschl = ms_t041a-bssha.
        ELSE.
          r_bschl = ms_t041a-bssso.
        ENDIF.
    ENDCASE.

  ENDMETHOD.

*&---------------------------------------------------------------------*
*& 客户清账
*&---------------------------------------------------------------------*
  METHOD post_f_32.

    IF it_clearing_line IS INITIAL.
      result-mtype = 'E'.
      result-mtype = '没有需要清账'.
      RETURN.
    ENDIF.

    DATA(lo_ins) = NEW lcl_clearing_account( ).
    lo_ins->m_bukrs = i_bukrs.
    lo_ins->m_koart = 'D'.
    lo_ins->m_hkont = i_kunnr.
    lo_ins->get_bsid( it_clearing_line ).
    lo_ins->posting_interface( ).
    result = lo_ins->ms_result.

  ENDMETHOD.

*&---------------------------------------------------------------------*
*& 供应商清账
*&---------------------------------------------------------------------*
  METHOD post_f_44.

    CHECK it_clearing_line IS NOT INITIAL.

    DATA(lo_ins) = NEW lcl_clearing_account( ).
    lo_ins->m_bukrs = i_bukrs.
    lo_ins->m_koart = 'K'.
    lo_ins->m_hkont = i_lifnr.
    lo_ins->get_bsik( it_clearing_line ).
    lo_ins->posting_interface( ).
    result = lo_ins->ms_result.

  ENDMETHOD.

*&---------------------------------------------------------------------*
*& 获取客户未清数据
*&---------------------------------------------------------------------*
  METHOD get_bsid.
    CHECK it_clearing_line IS NOT INITIAL.

    " 检查并获取可以清账的凭证数据
    SELECT
      bukrs,
      belnr,
      gjahr,
      buzei,
      projk, " 客户WBS必填
      umsks, " 特殊总账事务
      umskz, " 特殊总账标识
      shkzg,
      wrbtr
      FROM bsid
      FOR ALL ENTRIES IN @it_clearing_line[]
      WHERE bukrs = @it_clearing_line-bukrs
        AND belnr = @it_clearing_line-belnr
        AND gjahr = @it_clearing_line-gjahr
        AND buzei = @it_clearing_line-buzei
      INTO CORRESPONDING FIELDS OF TABLE @mt_bseg.

  ENDMETHOD.

*&---------------------------------------------------------------------*
*& 获取供应商未清数据
*&---------------------------------------------------------------------*
  METHOD get_bsik.
    CHECK it_clearing_line IS NOT INITIAL.

    " 检查并获取可以清账的凭证数据
    SELECT
      bukrs,
      belnr,
      gjahr,
      buzei,
      umsks, " 特殊总账事务
      umskz, " 特殊总账标识
      shkzg,
      wrbtr
      FROM bsik
      FOR ALL ENTRIES IN @it_clearing_line[]
      WHERE bukrs = @it_clearing_line-bukrs
        AND belnr = @it_clearing_line-belnr
        AND gjahr = @it_clearing_line-gjahr
        AND buzei = @it_clearing_line-buzei
      INTO CORRESPONDING FIELDS OF TABLE @mt_bseg.

  ENDMETHOD.

*&---------------------------------------------------------------------*
*& 调用标准方法POSTING_INTERFACE_CLEARING进行清账
*&---------------------------------------------------------------------*
  METHOD posting_before.

    IF m_bukrs IS INITIAL.
      ms_result-mtype = 'E'.
      ms_result-msg = '请输入公司代码'.
      RETURN.
    ENDIF.

    IF m_hkont IS INITIAL.
      ms_result-mtype = 'E'.
      ms_result-msg = '请输入客商'.
      RETURN.
    ENDIF.

    IF m_koart = 'D'
    OR m_koart = 'K'.
    ELSE.
      ms_result-mtype = 'E'.
      ms_result-msg = '目前不支持非客商清账'.
      RETURN.
    ENDIF.

    IF mt_bseg IS INITIAL.
      ms_result-mtype = 'E'.
      ms_result-msg = '没有需要清账的数据'.
      RETURN.
    ENDIF.

  ENDMETHOD.

*&---------------------------------------------------------------------*
*& 调用标准方法POSTING_INTERFACE_CLEARING进行清账
*&---------------------------------------------------------------------*
  METHOD posting_interface.

    " 清账项目选择条件
    " 选择字段填BELNR，并传值是凭证+行项目，就能取到对应凭证行
    " 因此无需其他额外的筛选条件
    " 如果不能确定，或者就需要某一类的数据，可以自己酌情调整
    DATA ls_ftclear LIKE LINE OF mt_ftclear.
    DEFINE _ftclear.
      CLEAR ls_ftclear.
      ls_ftclear-agbuk = m_bukrs. " 公司
      ls_ftclear-agkon = m_hkont. " 科目
      ls_ftclear-agkoa = m_koart. " 账户类型
      ls_ftclear-selfd = &1.
      ls_ftclear-selvon = &2.
      INSERT ls_ftclear INTO TABLE mt_ftclear.
    END-OF-DEFINITION.

    " 手工清账项目，对于存在差额的项目，需要手工填写清账金额
    " 就是BDC录屏，如果有缺什么字段，可以到前台F1获取屏幕字段名
    DATA ls_ftpost LIKE LINE OF mt_ftpost.
    DEFINE _ftpost.
      IF &4 IS NOT INITIAL OR &4 <> ''.
        CLEAR ls_ftpost.
        ls_ftpost-stype = &1. " K抬头，P行项目
        ls_ftpost-count = &2. " 抬头默认1，行项目流水
        ls_ftpost-fnam  = &3. " 屏幕字段
        ls_ftpost-fval  = &4. " 字段值
        INSERT ls_ftpost INTO TABLE mt_ftpost.
      ENDIF.
    END-OF-DEFINITION.

    " 数据校验
    CLEAR ms_result.
    posting_before( ).
    CHECK ms_result-mtype <> 'E'.

    " 写入清账凭证行并计算差额
    DATA l_amount_diff TYPE p LENGTH 16 DECIMALS 2. " 差额，P类型最大值
    LOOP AT mt_bseg REFERENCE INTO DATA(lr_bseg).
      " 对项目清账
      DATA(l_selfd) = 'BELNR'.
      DATA(l_selval) = |{ lr_bseg->belnr }{ lr_bseg->gjahr }{ lr_bseg->buzei }|.
      _ftclear l_selfd l_selval.
      " 汇总金额，获取清算差值
      IF lr_bseg->shkzg = 'S'.
        l_amount_diff = l_amount_diff + lr_bseg->wrbtr.
      ELSE.
        l_amount_diff = l_amount_diff - lr_bseg->wrbtr.
      ENDIF.
    ENDLOOP.

    " 获取其他辅助参数
    DATA l_umsks TYPE umsks. " 特殊总账事务
    DATA l_umskz TYPE umskz. " 特殊总账标识
    DATA lr_clearing_ref TYPE REF TO bseg.
    LOOP AT mt_bseg REFERENCE INTO lr_bseg.
      " 只要有一行是特殊总账事务，清账就以特殊总账方式进行
      IF l_umsks IS INITIAL.
        l_umsks = lr_bseg->umsks.
        l_umskz = lr_bseg->umskz.
      ENDIF.
      " 找出金额绝对值最大的行作为参考行
      " 我这个项目需要将金额绝对值最大的行，作为清账参考凭证行
      " 不需要的话可以注释掉
      IF lr_clearing_ref IS NOT BOUND.
        lr_clearing_ref = lr_bseg.
      ELSEIF abs( lr_bseg->wrbtr ) > abs( lr_clearing_ref->wrbtr ).
        lr_clearing_ref = lr_bseg.
      ENDIF.
    ENDLOOP.

    DATA(l_budat) = |{ sy-datum DATE = USER }|. " BDC录屏，日期要填写用户格式
    SELECT SINGLE waers FROM t001 WHERE bukrs = @m_bukrs INTO @DATA(l_waers). " 公司本币

    " K-抬头
    _ftpost 'K' 1 'BKPF-BUKRS' m_bukrs.
    _ftpost 'K' 1 'BKPF-BLART' 'AB'. " 清账只有这一种凭证类型
    _ftpost 'K' 1 'BKPF-BLDAT' l_budat.
    _ftpost 'K' 1 'BKPF-BUDAT' l_budat.
    _ftpost 'K' 1 'BKPF-MONAT' sy-datum+4(2).
    _ftpost 'K' 1 'BKPF-WAERS' l_waers.

    " 如果清账存在差额，则手工生成一行记账
    IF l_amount_diff <> 0.
      " 根据科目、总账事务、余额，查找记账码
      DATA(l_bschl) = determine_posting_key(
        i_koart = m_koart
        i_umsks = l_umsks
        i_amount_diff = l_amount_diff
      ).
      DATA(l_wrbtr) = |{ l_amount_diff NUMBER = USER }|. " BDC外部格式
      DATA(l_sgext) = |清账{ lr_clearing_ref->belnr }|. " 行文本

      " P-行项目
      " 我这项目要求清账后生成无凭证行或一行差额的清账凭证
      " 有生成多行要求的自己酌情修改
      _ftpost 'P' 1 'RF05A-NEWBS' l_bschl. " 过账码
      _ftpost 'P' 1 'RF05A-NEWKO' m_hkont. " 科目
      _ftpost 'P' 1 'RF05A-NEWUM' l_umskz. " 特别总账标识
      _ftpost 'P' 1 'BSEG-WRBTR' l_wrbtr. " 汇总后的差额
      _ftpost 'P' 1 'BSEG-SGTXT' l_sgext. " 行项目文本必填

      CASE m_koart.
        WHEN 'D'. " 客户
          _ftpost 'P' 1 'BSEG-PROJK' lr_clearing_ref->projk. " WBS，客户必填
        WHEN 'K'. " 供应商
      ENDCASE.

      " 金额绝对值最大的凭证行作为参考行
      _ftpost 'P' 1 'BSEG-REBZG' lr_clearing_ref->belnr.
      _ftpost 'P' 1 'BSEG-REBZJ' lr_clearing_ref->gjahr.
      _ftpost 'P' 1 'BSEG-REBZZ' lr_clearing_ref->buzei.
    ENDIF.

    DATA l_mode TYPE char01 VALUE 'N'. " BDC导入模式
    CALL FUNCTION 'POSTING_INTERFACE_START'
      EXPORTING
        i_client   = sy-mandt
        i_function = 'C'
        i_mode     = l_mode
        i_keep     = 'X'
        i_update   = 'S'
        i_user     = sy-uname.
    IF sy-subrc <> 0.
      ms_result-mtype = 'E'.
      MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
              WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4
              INTO ms_result-msg.
      RETURN.
    ENDIF.

    CALL FUNCTION 'POSTING_INTERFACE_CLEARING'
      EXPORTING
        i_auglv                    = ms_t041a-auglv " 清账程序固定UMBUCHNG
        i_tcode                    = 'FB05' " 固定
        i_sgfunct                  = 'C'
      IMPORTING
        e_msgid                    = sy-msgid
        e_msgno                    = sy-msgno
        e_msgty                    = sy-msgty
        e_msgv1                    = sy-msgv1
        e_msgv2                    = sy-msgv2
        e_msgv3                    = sy-msgv3
        e_msgv4                    = sy-msgv4
      TABLES
        t_blntab                   = mt_blntab
        t_ftclear                  = mt_ftclear
        t_ftpost                   = mt_ftpost
        t_fttax                    = mt_fttax
      EXCEPTIONS
        clearing_procedure_invalid = 1
        clearing_procedure_missing = 2
        table_t041a_empty          = 3
        transaction_code_invalid   = 4
        amount_format_error        = 5
        too_many_line_items        = 6
        company_code_invalid       = 7
        screen_not_found           = 8
        no_authorization           = 9
        OTHERS                     = 10.
    IF sy-subrc <> 0.
      ms_result-mtype = 'E'.
    ENDIF.
    MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
            WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4
            INTO ms_result-msg.

    CALL FUNCTION 'POSTING_INTERFACE_END'
      EXCEPTIONS
        session_not_processable = 1
        OTHERS                  = 2.
    IF sy-subrc <> 0.
      ms_result-mtype = 'E'.
      MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
              WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4
              INTO ms_result-msg.
      RETURN.
    ENDIF.

    READ TABLE mt_blntab INTO DATA(ls_blntab) INDEX 1.
    IF sy-subrc = 0.
      ms_result-mtype = 'S'.
      ms_result-msg = '清账已处理'.
      ms_result-belnr = ls_blntab-belnr.
    ELSE.
      ms_result-mtype = 'E'.
      IF ms_result-msg IS INITIAL.
        ms_result-msg = '清账处理失败'.
      ENDIF.
    ENDIF.

  ENDMETHOD.

ENDCLASS.

```

</details>

封装后，该类的使用方法也很简单，只需要传入公司、客商，以及需要清账的凭证行即可:

```ABAP

DATA lt_clearing_line TYPE lcl_clearing_account=>tt_clearing_line.
DATA ls_result TYPE lcl_clearing_account=>ty_result.

" 就是BSEG主键值
lt_clearing_line = VALUE #(
  ( bukrs = '1000' belnr = '90000001' gjahr = '2022' buzei = '001' )
  ( bukrs = '1000' belnr = '90000001' gjahr = '2022' buzei = '003' )
).

" 客户清账
ls_result = lcl_clearing_account=>post_f_32(
              i_bukrs          = '1000'
              i_kunnr          = '1001'
              it_clearing_line = lt_clearing_line ).

```

```ABAP

DATA lt_clearing_line TYPE lcl_clearing_account=>tt_clearing_line.
DATA ls_result TYPE lcl_clearing_account=>ty_result.

" 就是BSEG主键值
lt_clearing_line = VALUE #(
  ( bukrs = '1000' belnr = '90000002' gjahr = '2022' buzei = '002' )
  ( bukrs = '1000' belnr = '90000002' gjahr = '2022' buzei = '004' )
).

" 供应商清账
ls_result = lcl_clearing_account=>post_f_44(
              i_bukrs          = '1000'
              i_lifnr          = '8000001'
              it_clearing_line = lt_clearing_line ).

```
