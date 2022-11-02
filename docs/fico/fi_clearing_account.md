# 清账

清账的自开发主要使用以下标准函数（实际也是BDC）来处理：

- ***POSTING_INTERFACE_START***

- ***POSTING_INTERFACE_CLEARING***

- ***POSTING_INTERFACE_END***

## 分析说明

清账主要是两个问题：

- ***是否存在差异金额***

- ***差异金额的处理***

如果不存在差异金额，则只需要处理未清项即可。如果存在差异金额，则需要根据业务顾问的操作流程，调整差异金额处理与未清项处理的先后顺序。

正常来说，财务顾问都是先挑选未清项，再由系统自动生成差异行。上面的标准BDC函数却是反过来，这会导致一些问题，比如清账字段AUGBL为空，无法关联未清项。

> 系统自动生成的差异行，还会按配置自动带出额外信息，如果业务顾问对这些字段有要求，也会让人头秃。
>
> 改得吐血，改出下面的工具类，SAP不提供标准函数来处理真的是太难了。

## 清账工具

该工具将调用标准函数的一些通用操作封装起来，使用的时候，只需传入未清项即可。

<details>
  <summary>ZCL_FI_CLEARING</summary>

```ABAP
class ZCL_FI_CLEARING definition
  public
  create private .

public section.

  types:
    BEGIN OF ty_clearing_line,
        bukrs TYPE bseg-bukrs,
        belnr TYPE bseg-belnr,
        gjahr TYPE bseg-gjahr,
        buzei TYPE bseg-buzei,
      END OF ty_clearing_line .
  types:
    tt_clearing_line TYPE STANDARD TABLE OF ty_clearing_line WITH EMPTY KEY .
  types:
    BEGIN OF ty_result,
        mtype TYPE bapi_mtype,
        msg   TYPE bapi_msg,
        belnr TYPE bseg-belnr,
      END OF ty_result .

  class-methods CLASS_CONSTRUCTOR .
  class-methods POST_CUSTOMER
    importing
      !I_BUKRS type BUKRS
      !I_KUNNR type KUNNR
      !I_AGUMS type AGUMS default 'A'
      !I_BUDAT type BUDAT default SY-DATUM
      !I_BKTXT type BKTXT optional
      !IT_CLEARING_LINE type TT_CLEARING_LINE
      !I_PROC type CHAR01 default 'M'
      !IT_FTPOST type FAGL_T_FTPOST optional
    returning
      value(RESULT) type TY_RESULT .
  class-methods POST_VENDOR
    importing
      !I_BUKRS type BUKRS
      !I_LIFNR type LIFNR optional
      !I_AGUMS type AGUMS default 'A'
      !I_BUDAT type BUDAT default SY-DATUM
      !I_BKTXT type BKTXT optional
      !IT_CLEARING_LINE type TT_CLEARING_LINE
      !I_PROC type CHAR01 default 'M'
      !IT_FTPOST type FAGL_T_FTPOST optional
    returning
      value(RESULT) type TY_RESULT .
  class-methods POST_LEDGER
    importing
      !I_BUKRS type BUKRS
      !I_HKONT type HKONT
      !I_AGUMS type AGUMS optional
      !I_BUDAT type BUDAT default SY-DATUM
      !I_BKTXT type BKTXT optional
      !IT_CLEARING_LINE type TT_CLEARING_LINE
      !I_PROC type CHAR01 default 'M'
      !IT_FTPOST type FAGL_T_FTPOST optional
    returning
      value(RESULT) type TY_RESULT .
  class-methods BEFORE_FCODE_F11
    changing
      !FT type BDCDATA_TAB .
  class-methods AFTER_XFTPOST_LOOP
    changing
      !FT type BDCDATA_TAB .
protected section.
PRIVATE SECTION.

  CLASS-DATA ms_t041a TYPE t041a .
  CLASS-DATA:
    mt_tbsl TYPE STANDARD TABLE OF tbsl .
  CLASS-DATA:
    BEGIN OF ms_extra,
      diff_amount_proc TYPE CHAR01,
      program TYPE bdcdata-program,
      dynpro  TYPE bdcdata-dynpro,
      FTPOST TYPE STANDARD TABLE OF ftpost WITH EMPTY KEY,
    END OF ms_extra.
  DATA m_bukrs TYPE bukrs .
  DATA m_koart TYPE koart .
  DATA m_agums TYPE agums .
  DATA m_hkont TYPE hkont .
  DATA m_budat TYPE budat .
  DATA m_bktxt TYPE bktxt .
  DATA:
    mt_bseg TYPE STANDARD TABLE OF bseg .
  DATA ms_result TYPE ty_result .

  CLASS-METHODS determine_posting_key
    IMPORTING
      !i_koart       TYPE koart
      !i_umsks       TYPE umsks
      !i_amount_diff TYPE p
    RETURNING
      VALUE(r_bschl) TYPE bschl .
  METHODS get_bsid
    IMPORTING
      !it_clearing_line TYPE tt_clearing_line .
  METHODS get_bsik
    IMPORTING
      !it_clearing_line TYPE tt_clearing_line .
  METHODS get_bseg
    IMPORTING
      !it_clearing_line TYPE tt_clearing_line .
  METHODS posting_before .
  METHODS posting_interface .
ENDCLASS.



CLASS ZCL_FI_CLEARING IMPLEMENTATION.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method ZCL_FI_CLEARING=>AFTER_XFTPOST_LOOP
* +-------------------------------------------------------------------------------------------------+
* | [<-->] FT                             TYPE        BDCDATA_TAB
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD after_xftpost_loop.



    " 默认处理，先处理差异行，（再到该增强），再处理未清项
    CHECK ms_extra-diff_amount_proc = 'M'
       OR ms_extra-diff_amount_proc = ''.

    DATA ls_bdcdata TYPE bdcdata.
    DEFINE _bdc_data.
      CLEAR ls_bdcdata.
      ls_bdcdata-fnam = &1.
      ls_bdcdata-fval = &2.
      INSERT ls_bdcdata INTO TABLE ft[].
    END-OF-DEFINITION.

    " 按项目需求，填写需要的信息
    LOOP AT ms_extra-ftpost INTO DATA(ls_ftpost).
      _bdc_data ls_ftpost-fnam ls_ftpost-fval.
    ENDLOOP.


  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method ZCL_FI_CLEARING=>BEFORE_FCODE_F11
* +-------------------------------------------------------------------------------------------------+
* | [<-->] FT                             TYPE        BDCDATA_TAB
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD before_fcode_f11.


    " 先处理未清项，再处理差异行
    CHECK ms_extra-diff_amount_proc = 'A'. 

    DATA ls_bdcdata TYPE bdcdata.

    DEFINE _bdc_begin.
      CLEAR ls_bdcdata.
      ls_bdcdata-program = &1.
      ls_bdcdata-dynpro = &2.
      ls_bdcdata-dynbegin = 'X'.
      INSERT ls_bdcdata INTO TABLE ft[].
    END-OF-DEFINITION.

    DEFINE _bdc_data.
      CLEAR ls_bdcdata.
      ls_bdcdata-fnam = &1.
      ls_bdcdata-fval = &2.
      INSERT ls_bdcdata INTO TABLE ft[].
    END-OF-DEFINITION.

    " _bdc_begin 'SAPMF05A' '0733'. " 该增强位置是在保存前，原本的BDC代码只缺少命令
    _bdc_data 'BDC_OKCODE' 'PA'. " 处理未清项

    " MAIN - 标准
    " PART - 部分支付
    " REST - 剩余项目
    " WITH - 预扣税
    _bdc_begin 'SAPDF05X' '3100'.
    _bdc_data 'BDC_OKCODE' 'REST'. " 剩余过账

    _bdc_begin 'SAPDF05X' '3100'.
    _bdc_data 'BDC_OKCODE' 'PI'. " PI - 双击行

    _bdc_begin 'SAPDF05X' '3100'.
    _bdc_data 'BDC_OKCODE' 'BS'. " BS - 模拟

    IF ( ms_extra-program IS INITIAL OR ms_extra-dynpro IS INITIAL ) " 没有下一步的屏幕
    OR ms_extra-ftpost IS INITIAL. " 没有特殊处理
      " 没有需要补充的，直接保存
      _bdc_begin 'SAPMF05A' '0301'. " 补充一个屏幕
      " _bdc_data 'BDC_OKCODE' '/11'. " 后续的标准代码最后会手工添加一行命令保存
    ELSE.
*      " 正常情况，由于行项目必填，会跳到主界面报错
*      _bdc_begin 'SAPMF05A' '0700'.
*      _bdc_data 'BDC_OKCODE' 'NK'. " NK - 补充，跳转到需要补充数据的界面

      _bdc_begin 'SAPMF05A' '0700'.
      _bdc_data 'BDC_OKCODE' 'PI'. " 选择凭证行

      _bdc_begin 'SAPMF05A' '0610'.
      _bdc_data '*BSEG-BUZEI' '001'. " 默认选第一行
      _bdc_data 'BDC_OKCODE' 'ENTR'. " 确认

      " 按项目需求，填写需要手工处理的信息
      _bdc_begin ms_extra-program ms_extra-dynpro.
      LOOP AT ms_extra-ftpost INTO DATA(ls_ftpost).
        _bdc_data ls_ftpost-fnam ls_ftpost-fval.
      ENDLOOP.
    ENDIF.


  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method ZCL_FI_CLEARING=>CLASS_CONSTRUCTOR
* +-------------------------------------------------------------------------------------------------+
* +--------------------------------------------------------------------------------------</SIGNATURE>
  method CLASS_CONSTRUCTOR.


    " AUGLV对应FB05要处理的业务
    " UMBUCHNG, Transfer posting with clearing, 转账并清账
    SELECT SINGLE * FROM t041a WHERE auglv = 'UMBUCHNG' INTO @ms_t041a.
    SELECT * FROM tbsl INTO TABLE @mt_tbsl.


  endmethod.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Private Method ZCL_FI_CLEARING=>DETERMINE_POSTING_KEY
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_KOART                        TYPE        KOART
* | [--->] I_UMSKS                        TYPE        UMSKS
* | [--->] I_AMOUNT_DIFF                  TYPE        P
* | [<-()] R_BSCHL                        TYPE        BSCHL
* +--------------------------------------------------------------------------------------</SIGNATURE>
  method DETERMINE_POSTING_KEY.


    " 根据科目类型，特殊总账标识，差异金额，查找对应记账码
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


  endmethod.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method ZCL_FI_CLEARING->GET_BSEG
* +-------------------------------------------------------------------------------------------------+
* | [--->] IT_CLEARING_LINE               TYPE        TT_CLEARING_LINE
* +--------------------------------------------------------------------------------------</SIGNATURE>
  method GET_BSEG.

    CHECK it_clearing_line IS NOT INITIAL.

    " 检查并获取可以清账的凭证数据
    SELECT
      bseg~bukrs,
      bseg~belnr,
      bseg~gjahr,
      bseg~buzei,
      bseg~umsks, " 特殊总账事务
      bseg~umskz, " 特殊总账标识
      bseg~zfbdt, " 付款清算日期
      bseg~shkzg,
      bseg~dmbtr,
      bseg~wrbtr,
      bkpf~waers
      FROM bseg
      JOIN bkpf ON bseg~bukrs = bkpf~bukrs
               AND bseg~belnr = bkpf~belnr
               AND bseg~gjahr = bkpf~gjahr
      FOR ALL ENTRIES IN @it_clearing_line[]
      WHERE bseg~bukrs = @it_clearing_line-bukrs
        AND bseg~belnr = @it_clearing_line-belnr
        AND bseg~gjahr = @it_clearing_line-gjahr
        AND bseg~buzei = @it_clearing_line-buzei
      INTO CORRESPONDING FIELDS OF TABLE @mt_bseg.


  endmethod.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method ZCL_FI_CLEARING->GET_BSID
* +-------------------------------------------------------------------------------------------------+
* | [--->] IT_CLEARING_LINE               TYPE        TT_CLEARING_LINE
* +--------------------------------------------------------------------------------------</SIGNATURE>
  method GET_BSID.

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
      zfbdt, " 付款清算日期
      shkzg,
      dmbtr,
      wrbtr,
      waers
      FROM bsid
      FOR ALL ENTRIES IN @it_clearing_line[]
      WHERE bukrs = @it_clearing_line-bukrs
        AND belnr = @it_clearing_line-belnr
        AND gjahr = @it_clearing_line-gjahr
        AND buzei = @it_clearing_line-buzei
      INTO CORRESPONDING FIELDS OF TABLE @mt_bseg.


  endmethod.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method ZCL_FI_CLEARING->GET_BSIK
* +-------------------------------------------------------------------------------------------------+
* | [--->] IT_CLEARING_LINE               TYPE        TT_CLEARING_LINE
* +--------------------------------------------------------------------------------------</SIGNATURE>
  method GET_BSIK.

    CHECK it_clearing_line IS NOT INITIAL.

    " 检查并获取可以清账的凭证数据
    SELECT
      bukrs,
      belnr,
      gjahr,
      buzei,
      umsks, " 特殊总账事务
      umskz, " 特殊总账标识
      zfbdt, " 付款清算日期
      shkzg,
      dmbtr,
      wrbtr,
      waers
      FROM bsik
      FOR ALL ENTRIES IN @it_clearing_line[]
      WHERE bukrs = @it_clearing_line-bukrs
        AND belnr = @it_clearing_line-belnr
        AND gjahr = @it_clearing_line-gjahr
        AND buzei = @it_clearing_line-buzei
      INTO CORRESPONDING FIELDS OF TABLE @mt_bseg.


  endmethod.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method ZCL_FI_CLEARING->POSTING_BEFORE
* +-------------------------------------------------------------------------------------------------+
* +--------------------------------------------------------------------------------------</SIGNATURE>
  method POSTING_BEFORE.


    IF m_bukrs IS INITIAL.
      ms_result-mtype = 'E'.
      ms_result-msg = '请输入公司代码'.
      RETURN.
    ENDIF.

    IF m_hkont IS INITIAL.
      ms_result-mtype = 'E'.
      ms_result-msg = '请输入科目'.
      RETURN.
    ENDIF.

    IF m_koart = 'D'
    OR m_koart = 'K'
    OR m_koart = 'S'.
    ELSE.
      ms_result-mtype = 'E'.
      ms_result-msg = '目前仅支持客户清账、供应商清账、总账清账'.
      RETURN.
    ENDIF.

    IF mt_bseg IS INITIAL.
      ms_result-mtype = 'E'.
      ms_result-msg = '没有未清凭证数据'.
      RETURN.
    ENDIF.


  endmethod.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Private Method ZCL_FI_CLEARING->POSTING_INTERFACE
* +-------------------------------------------------------------------------------------------------+
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD posting_interface.


    DATA:
      lt_ftclear TYPE STANDARD TABLE OF ftclear,
      lt_ftpost  TYPE STANDARD TABLE OF ftpost,
      lt_blntab  TYPE STANDARD TABLE OF blntab,
      lt_fttax   TYPE STANDARD TABLE OF fttax.

    " 清账项目选择条件
    " 选择字段填BELNR，并传值是凭证+行项目，就能取到对应凭证行
    " 因此无需其他额外的筛选条件
    " 如果不能确定，或者就需要某一类的数据，可以自己酌情调整
    DATA ls_ftclear TYPE ftclear.
    DEFINE _ftclear.
      CLEAR ls_ftclear.
      ls_ftclear-agbuk = m_bukrs. " 公司
      ls_ftclear-agkon = m_hkont. " 科目
      ls_ftclear-agkoa = m_koart. " 账户类型
      ls_ftclear-xnops = abap_true. " 标准未清项
      ls_ftclear-agums = m_agums. " 特别总账标识
      ls_ftclear-selfd = &2.
      ls_ftclear-selvon = &3.
      INSERT ls_ftclear INTO TABLE &1.
    END-OF-DEFINITION.

    " 手工清账项目，对于存在差额的项目，需要手工填写清账金额
    " 就是BDC录屏，如果有缺什么字段，可以到前台F1获取屏幕字段名
    DATA ls_ftpost TYPE ftpost.
    DEFINE _ftpost.
      IF &4 IS NOT INITIAL OR &4 <> ''.
        CLEAR ls_ftpost.
        ls_ftpost-stype = &2. " K抬头，P行项目
        ls_ftpost-count = &3. " 抬头默认1，行项目流水
        ls_ftpost-fnam  = &4. " 屏幕字段
        ls_ftpost-fval  = &5. " 字段值
        INSERT ls_ftpost INTO TABLE &1.
      ENDIF.
    END-OF-DEFINITION.

    " 数据校验
    CLEAR ms_result.
    posting_before( ).
    CHECK ms_result-mtype <> 'E'.

    " 未清项目
    LOOP AT mt_bseg REFERENCE INTO DATA(lr_bseg).
      DATA(l_selfd) = 'BELNR'.
      DATA(l_selval) = |{ lr_bseg->belnr }{ lr_bseg->gjahr }{ lr_bseg->buzei }|.
      _ftclear lt_ftclear l_selfd l_selval.
    ENDLOOP.

    " 汇总金额，获取清账差异金额
    DATA l_amount_diff TYPE p LENGTH 16 DECIMALS 2. " 差额，P类型最大值
    LOOP AT mt_bseg REFERENCE INTO lr_bseg.
      IF lr_bseg->shkzg = 'S'.
        l_amount_diff = l_amount_diff + lr_bseg->dmbtr.
      ELSE.
        l_amount_diff = l_amount_diff - lr_bseg->dmbtr.
      ENDIF.
    ENDLOOP.

    " 获取其他辅助参数
    DATA l_umsks TYPE umsks. " 特殊总账事务
    DATA l_umskz TYPE umskz. " 特殊总账标识
    DATA lr_clearing_ref TYPE REF TO bseg. " 任取一行未清项作为差异金额的参考
    LOOP AT mt_bseg REFERENCE INTO lr_bseg.
      " 只要有一行是特殊总账事务，清账就以特殊总账方式进行
      IF l_umsks IS INITIAL.
        l_umsks = lr_bseg->umsks.
        l_umskz = lr_bseg->umskz.
      ENDIF.
      " 找出金额绝对值最大的行作为参考行
      " （我这项目要求如此，可自行调整）
      IF lr_clearing_ref IS NOT BOUND.
        lr_clearing_ref = lr_bseg.
      ELSEIF abs( lr_bseg->dmbtr ) > abs( lr_clearing_ref->dmbtr ).
        lr_clearing_ref = lr_bseg.
      ENDIF.
    ENDLOOP.

    DATA(l_budat) = |{ m_budat DATE = USER }|. " BDC录屏，日期要填写用户格式
    SELECT SINGLE waers FROM t001 WHERE bukrs = @m_bukrs INTO @DATA(l_waers). " 公司本币

    " K-抬头
    _ftpost lt_ftpost 'K' 1 'BKPF-BUKRS' m_bukrs.
    _ftpost lt_ftpost 'K' 1 'BKPF-BLART' 'AB'. " 清账只有这一种凭证类型
    _ftpost lt_ftpost 'K' 1 'BKPF-BLDAT' l_budat.
    _ftpost lt_ftpost 'K' 1 'BKPF-BUDAT' l_budat.
    _ftpost lt_ftpost 'K' 1 'BKPF-MONAT' m_budat+4(2).
    _ftpost lt_ftpost 'K' 1 'BKPF-WAERS' l_waers.
    IF m_bktxt IS NOT INITIAL.
      _ftpost lt_ftpost 'K' 1 'BKPF-BKTXT' m_bktxt.
    ENDIF.

    " 判断是否存在差异金额
    IF l_amount_diff = 0.
      CLEAR ms_extra.  " 没有差异金额，无需任何增强处理
    ELSE. " 存在差异金额
      " 根据科目、总账事务、余额，查找记账码
      DATA l_bschl TYPE bschl.
      l_bschl = determine_posting_key(
        i_koart = m_koart
        i_umsks = l_umsks
        i_amount_diff = l_amount_diff
      ).

      DATA l_sgtxt TYPE bseg-sgtxt.
      l_sgtxt = |清账{ lr_clearing_ref->belnr }|. " 行文本，记录参考的凭证

      " 对差异金额的处理方案选择
      CASE ms_extra-diff_amount_proc.
        WHEN 'A'. " 自动清账，先处理未清项，再处理差异金额
          " 移除手工清账部分
          DELETE lt_ftpost WHERE stype = 'P'.

          " 项目特殊处理
          IF l_umskz IS NOT INITIAL " 特殊总账
          OR l_bschl+1(1) = '9'. " 冲销
            DELETE ms_extra-ftpost WHERE fnam <> 'BSEG-SGTXT'. " 仅文本可输入
          ENDIF.

          " 复制LFIPIF00中的子例程dynpro_ermitteln
          DATA l_winfk TYPE t019w-winfk.
          CLEAR l_winfk.
          CASE m_koart.
            WHEN 'D'.
              l_winfk = 'ZKOD'.
            WHEN 'K'.
              l_winfk = 'ZKOK'.
            WHEN 'S'.
              l_winfk = 'ZKOS'.
            WHEN 'A'.
              l_winfk = 'ZKOA'.
          ENDCASE.

          " 查找差异行的屏幕（从POSTING_INTERFACE_CLEARING中找到的代码）
          CALL FUNCTION 'NEXT_DYNPRO_SEARCH'
            EXPORTING
              i_bschl  = l_bschl
              i_bukrs  = m_bukrs
              i_tcode  = 'FB05'
              i_umskz  = l_umskz
              i_winfk  = l_winfk
            IMPORTING
              e_dynnra = ms_extra-dynpro
              e_mpool  = ms_extra-program
            EXCEPTIONS
              OTHERS   = 99.
          IF sy-subrc <> 0.
            CLEAR ms_extra.
          ENDIF.

        WHEN OTHERS. " 手工清账，先处理差异金额

          DATA(l_dmbtr) = |{ abs( l_amount_diff ) NUMBER = USER }|. " BDC外部格式，另外正负按记账码区分，所以都传正值
          DATA(l_zfbdt) = |{ lr_clearing_ref->zfbdt DATE = USER }|. " BDC外部格式

          " P-行项目
          " 我这项目要求清账后生成无凭证行或一行差额的清账凭证
          " 有生成多行要求的自己酌情修改
          _ftpost lt_ftpost 'P' 1 'RF05A-NEWBS' l_bschl. " 过账码
          _ftpost lt_ftpost 'P' 1 'RF05A-NEWKO' m_hkont. " 科目
          _ftpost lt_ftpost 'P' 1 'RF05A-NEWUM' l_umskz. " 特别总账标识
          _ftpost lt_ftpost 'P' 1 'BSEG-WRBTR' l_dmbtr. " 汇总后的差额
          _ftpost lt_ftpost 'P' 1 'BSEG-ZFBDT' l_zfbdt. " 付款清算日期
          _ftpost lt_ftpost 'P' 1 'BSEG-SGTXT' l_sgtxt. " 行项目文本必填
          
      ENDCASE.

    ENDIF. " IF l_amount_diff <> 0.

    SORT lt_ftpost BY stype count fnam fval.
    DELETE ADJACENT DUPLICATES FROM lt_ftpost COMPARING stype count fnam.

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
        i_no_auth                  = 'X' " 不考虑权限
      IMPORTING
        e_msgid                    = sy-msgid
        e_msgno                    = sy-msgno
        e_msgty                    = sy-msgty
        e_msgv1                    = sy-msgv1
        e_msgv2                    = sy-msgv2
        e_msgv3                    = sy-msgv3
        e_msgv4                    = sy-msgv4
      TABLES
        t_blntab                   = lt_blntab
        t_ftclear                  = lt_ftclear
        t_ftpost                   = lt_ftpost
        t_fttax                    = lt_fttax
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

    READ TABLE lt_blntab INTO DATA(ls_blntab) INDEX 1.
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


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method ZCL_FI_CLEARING=>POST_CUSTOMER
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_BUKRS                        TYPE        BUKRS
* | [--->] I_KUNNR                        TYPE        KUNNR
* | [--->] I_AGUMS                        TYPE        AGUMS (default ='A')
* | [--->] I_BUDAT                        TYPE        BUDAT (default =SY-DATUM)
* | [--->] I_BKTXT                        TYPE        BKTXT(optional)
* | [--->] IT_CLEARING_LINE               TYPE        TT_CLEARING_LINE
* | [--->] I_PROC                         TYPE        CHAR01 (default ='M')
* | [--->] IT_FTPOST                      TYPE        FAGL_T_FTPOST(optional)
* | [<-()] RESULT                         TYPE        TY_RESULT
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD post_customer.


    IF it_clearing_line IS INITIAL.
      result-mtype = 'E'.
      result-mtype = '没有未清项'.
      RETURN.
    ENDIF.

    CLEAR ms_extra.
    " A-先处理未清项，再由系统带出差异行，最后对差异行进行手工调整
    " M-先手工生成并调整差异行，再处理未清项
    ms_extra-diff_amount_proc = i_proc.
    ms_extra-ftpost = it_ftpost. " 除了我预留的那些字段，按项目可能会有不同设置，可以通过该项设置

    DATA(lo_ins) = NEW zcl_fi_clearing( ).
    lo_ins->m_bukrs = i_bukrs.
    lo_ins->m_koart = 'D'.
    lo_ins->m_agums = i_agums.
    lo_ins->m_hkont = i_kunnr.
    lo_ins->m_budat = i_budat.
    lo_ins->m_bktxt = i_bktxt.
    lo_ins->get_bsid( it_clearing_line ).
    lo_ins->posting_interface( ).
    result = lo_ins->ms_result.

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method ZCL_FI_CLEARING=>POST_LEDGER
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_BUKRS                        TYPE        BUKRS
* | [--->] I_HKONT                        TYPE        HKONT
* | [--->] I_AGUMS                        TYPE        AGUMS(optional)
* | [--->] I_BUDAT                        TYPE        BUDAT (default =SY-DATUM)
* | [--->] I_BKTXT                        TYPE        BKTXT(optional)
* | [--->] IT_CLEARING_LINE               TYPE        TT_CLEARING_LINE
* | [--->] I_PROC                         TYPE        CHAR01 (default ='M')
* | [--->] IT_FTPOST                      TYPE        FAGL_T_FTPOST(optional)
* | [<-()] RESULT                         TYPE        TY_RESULT
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD POST_LEDGER.


    IF it_clearing_line IS INITIAL.
      result-mtype = 'E'.
      result-mtype = '没有未清项'.
      RETURN.
    ENDIF.

    CLEAR ms_extra.
    " A-先处理未清项，再由系统带出差异行，最后对差异行进行手工调整
    " M-先手工生成并调整差异行，再处理未清项
    ms_extra-diff_amount_proc = i_proc.
    ms_extra-ftpost = it_ftpost. " 除了我预留的那些字段，按项目可能会有不同设置，可以通过该项设置

    DATA(lo_ins) = NEW zcl_fi_clearing( ).
    lo_ins->m_bukrs = i_bukrs.
    lo_ins->m_koart = 'S'.
    lo_ins->m_hkont = i_hkont.
    lo_ins->m_budat = i_budat.
    lo_ins->m_bktxt = i_bktxt.
    lo_ins->get_bseg( it_clearing_line ).
    lo_ins->posting_interface( ).
    result = lo_ins->ms_result.


  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method ZCL_FI_CLEARING=>POST_VENDOR
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_BUKRS                        TYPE        BUKRS
* | [--->] I_LIFNR                        TYPE        LIFNR(optional)
* | [--->] I_AGUMS                        TYPE        AGUMS (default ='A')
* | [--->] I_BUDAT                        TYPE        BUDAT (default =SY-DATUM)
* | [--->] I_BKTXT                        TYPE        BKTXT(optional)
* | [--->] IT_CLEARING_LINE               TYPE        TT_CLEARING_LINE
* | [--->] I_PROC                         TYPE        CHAR01 (default ='M')
* | [--->] IT_FTPOST                      TYPE        FAGL_T_FTPOST(optional)
* | [<-()] RESULT                         TYPE        TY_RESULT
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD POST_VENDOR.


    IF it_clearing_line IS INITIAL.
      result-mtype = 'E'.
      result-mtype = '没有未清项'.
      RETURN.
    ENDIF.

    CLEAR ms_extra.
    " A-先处理未清项，再由系统带出差异行，最后对差异行进行手工调整
    " M-先手工生成并调整差异行，再处理未清项
    ms_extra-diff_amount_proc = i_proc.
    ms_extra-ftpost = it_ftpost. " 除了我预留的那些字段，按项目可能会有不同设置，可以通过该项设置

    DATA(lo_ins) = NEW zcl_fi_clearing( ).
    lo_ins->m_bukrs = i_bukrs.
    lo_ins->m_koart = 'K'.
    lo_ins->m_agums = i_agums.
    lo_ins->m_hkont = i_lifnr.
    lo_ins->m_budat = i_budat.
    lo_ins->m_bktxt = i_bktxt.
    lo_ins->get_bsik( it_clearing_line ).
    lo_ins->posting_interface( ).
    result = lo_ins->ms_result.


  ENDMETHOD.
ENDCLASS.

```

</details>

## 增强处理

通过增强来调整差异金额的处理顺序，经分析，在函数 ***POSTING_INTERFACE_CLEARING*** 中选取了两个位置来处理：

> 也可以将 ***POSTING_INTERFACE_CLEARING*** 的函数组拷贝一个出来修改。函数组内容不多。

<details>
  <summary>子例程 xftpost_loop 后加入</summary>

```ABAP

...

*------- Buchungsdatentabelle (XFTPOST) abarbeiten im Loop -------------
  PERFORM xftpost_loop.
*{   INSERT         S4DKXXXXXX                                        1
*
  " 用于处理差异凭证行
  CALL METHOD zcl_fi_clearing=>after_xftpost_loop
    CHANGING
      ft = ft[].
*}   INSERT

...

```

</details>

<details>
  <summary>子例程 fcode_f11 前加入</summary>

```ABAP

...

*------- Transaktion abschließen ---------------------------------------

*{   INSERT         S4DKXXXXXX                                        2
*
  " 用于处理差异凭证行
  CALL METHOD zcl_fi_clearing=>before_fcode_f11
    CHANGING
      ft = ft[].
  DESCRIBE TABLE ft LINES index. " 必须，后续代码是根据index新增保存命令
*}   INSERT

  PERFORM fcode_f11.

...

```

</details>

## 用例

<details>
  <summary>客户手工清账</summary>

```ABAP

DATA lt_clearing_line TYPE lcl_clearing_account=>tt_clearing_line.
lt_clearing_line = VALUE #(
  ( bukrs = '1000' belnr = '90000001' gjahr = '2022' buzei = '001' )
  ( bukrs = '1000' belnr = '90000001' gjahr = '2022' buzei = '003' )
).

" 客户清账
DATA(ls_result) = zcl_fi_clearing=>post_customer(
                    i_bukrs          = '1000'
                    i_kunnr          = '1001'
                    it_clearing_line = lt_clearing_line ).

```

</details>

<details>
  <summary>供应商手工清账</summary>

```ABAP

DATA lt_clearing_line TYPE lcl_clearing_account=>tt_clearing_line.
lt_clearing_line = VALUE #(
  ( bukrs = '1000' belnr = '90000002' gjahr = '2022' buzei = '002' )
  ( bukrs = '1000' belnr = '90000002' gjahr = '2022' buzei = '004' )
).

" 供应商清账
DATA(ls_result) = zcl_fi_clearing=>post_vendor(
              i_bukrs          = '1000'
              i_lifnr          = '8000001'
              it_clearing_line = lt_clearing_line ).

```

</details>

<details>
  <summary>先选择未清项，再处理差异行</summary>

```ABAP

DATA lt_clearing_line TYPE lcl_clearing_account=>tt_clearing_line.
lt_clearing_line = VALUE #(
  ( bukrs = '1000' belnr = '90000001' gjahr = '2022' buzei = '001' )
  ( bukrs = '1000' belnr = '90000001' gjahr = '2022' buzei = '003' )
).

DATA lt_ftpost TYPE lcl_clearing_account=>tt_clearing_line.
_ftpost lt_ftpost 'P' 1 'BSEG-ZUONR' '0000001001'. " 分配值
_ftpost lt_ftpost 'P' 1 'BSEG-HKONT' '2201000010'. " 总账默认客户总账，调整为另一个
_ftpost lt_ftpost 'P' 1 'BSEG-SGTXT' '行文本'.

" 客户清账
DATA(ls_result) = zcl_fi_clearing=>post_customer(
                    i_bukrs          = '1000'
                    i_kunnr          = '1001'
                    it_clearing_line = lt_clearing_line
                    i_porc           = 'A' 
                    it_ftpost        = lt_ftpost ).

```

</details>
