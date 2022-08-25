# 文本取值工具

报表部分字段需要取文本，这里将频率较高的字段整理出来，以后就不用重复写SQL查表了。

> ECC酌情使用，程序每字段取值就通过\[SELECT SINGLE\]访问数据库，性能远不如直接批量查询。
>
> HANA性能有巨大提升，可以忽略这部分损失

<details>
<summary>ZCL_TEXT</summary>

``` abap

CLASS zcl_text DEFINITION
  PUBLIC
  FINAL
  CREATE PRIVATE .

  PUBLIC SECTION.

    CLASS-DATA bukrs TYPE REF TO zcl_text READ-ONLY .
    CLASS-DATA bp TYPE REF TO zcl_text READ-ONLY .
    CLASS-DATA matnr TYPE REF TO zcl_text READ-ONLY .
    CLASS-DATA werks TYPE REF TO zcl_text READ-ONLY .
    CLASS-DATA user TYPE REF TO zcl_text .

    CLASS-METHODS class_constructor .
    CLASS-METHODS create
      IMPORTING
        !i_name        TYPE string
      RETURNING
        VALUE(ro_text) TYPE REF TO zcl_text .
    CLASS-METHODS domain
      IMPORTING
        !i_domname     TYPE domname
      RETURNING
        VALUE(ro_text) TYPE REF TO zcl_text .
    CLASS-METHODS create_ausp
      IMPORTING
        !i_objectkey   TYPE bapi1003_key-object
        !i_objecttable TYPE bapi1003_key-objecttable OPTIONAL
        !i_classnum    TYPE bapi1003_key-classnum OPTIONAL
        !i_classtype   TYPE bapi1003_key-classtype OPTIONAL
      RETURNING
        VALUE(ro_text) TYPE REF TO zcl_text .
    METHODS get
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    CLASS-METHODS long_text
      IMPORTING
        !i_id          TYPE thead-tdid
        !i_language    TYPE thead-tdspras DEFAULT '1'
        !i_name        TYPE thead-tdname
        !i_object      TYPE thead-tdobject
      EXPORTING
        !et_tline      TYPE tline_t
        !e_value       TYPE string
      RETURNING
        VALUE(r_value) TYPE string .
  PROTECTED SECTION.
  PRIVATE SECTION.

    TYPES:
      BEGIN OF ty_text,
        key   TYPE string,
        value TYPE string,
      END OF ty_text .
    TYPES:
      tt_text TYPE SORTED TABLE OF ty_text WITH NON-UNIQUE KEY key .
    TYPES:
      BEGIN OF ty_text_instance,
        name   TYPE string,
        o_text TYPE REF TO zcl_text,
      END OF ty_text_instance .
    TYPES:
      tt_text_instance TYPE SORTED TABLE OF ty_text_instance WITH NON-UNIQUE KEY name .
    TYPES:
      BEGIN OF ty_domains,
        domname TYPE domname,
        o_text  TYPE REF TO zcl_text,
      END OF ty_domains .
    TYPES:
      tt_domnames TYPE SORTED TABLE OF ty_domains WITH NON-UNIQUE KEY domname .
    TYPES:
      BEGIN OF ty_ausp,
        objectkey   TYPE bapi1003_key-object,
        objecttable TYPE bapi1003_key-objecttable,
        classnum    TYPE bapi1003_key-classnum,
        classtype   TYPE bapi1003_key-classtype,
        o_text      TYPE REF TO zcl_text,
      END OF ty_ausp .
    TYPES:
      tt_ausp TYPE SORTED TABLE OF ty_ausp WITH NON-UNIQUE KEY objectkey objecttable classnum classtype .

    DATA mt_text TYPE tt_text .
    DATA m_name TYPE string .
    DATA m_method TYPE abap_methname .
    CLASS-DATA mt_text_instance TYPE tt_text_instance .
    CLASS-DATA mt_domains TYPE tt_domnames .
    CLASS-DATA mt_ausp TYPE tt_ausp .
    CLASS-DATA mo_objectdescr TYPE REF TO cl_abap_objectdescr .

    METHODS constructor
      IMPORTING
        !i_name TYPE string .
    METHODS _bukrs
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS _bp
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS _matnr
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS _werks
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS _lgort
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS _prctr
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS _waers
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS _domain
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS _ausp
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS _user
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
    METHODS _not_found
      IMPORTING
        !i_key         TYPE data
      RETURNING
        VALUE(r_value) TYPE string .
ENDCLASS.



CLASS zcl_text IMPLEMENTATION.


  METHOD class_constructor.

    " 分析自身，获取可以提供的文本处理方法
    mo_objectdescr ?= cl_abap_typedescr=>describe_by_name( 'ZCL_TEXT' ).

    " 设置几个常用的
    bukrs = create( 'BUKRS' ).
    bp = create( 'BP' ).
    matnr = create( 'MATNR' ).
    werks = create( 'WERKS' ).
    user = create( 'USER' ).

  ENDMETHOD.


  METHOD constructor.

    m_name = i_name.
    m_method = |_{ m_name }|.

  ENDMETHOD.


  METHOD create.

    " V3，相比之前，精简为单文件，方便搬运
    DATA(l_name) = to_upper( i_name ).

    " 检查缓存记录
    READ TABLE mt_text_instance INTO DATA(ls_text_instance) WITH KEY name = l_name BINARY SEARCH.
    IF sy-subrc <> 0.
      " 没有就新建一条记录缓存
      CLEAR ls_text_instance.
      ls_text_instance-name = l_name.

      " 检查是否存在相应处理方法
      DATA l_method TYPE abap_methname.
      l_method = |_{ l_name }|.
      READ TABLE mo_objectdescr->methods TRANSPORTING NO FIELDS WITH KEY name = l_method BINARY SEARCH.
      IF sy-subrc <> 0.
        l_name = 'NOT_FOUND'.
      ENDIF.
      ls_text_instance-o_text = NEW zcl_text( l_name ).

      INSERT ls_text_instance INTO TABLE mt_text_instance.
    ENDIF.

    ro_text = ls_text_instance-o_text.

  ENDMETHOD.


  METHOD create_ausp.
  
    DATA l_object_key TYPE ausp-objek.

    READ TABLE mt_ausp INTO DATA(ls_ausp) WITH KEY
    objectkey   = i_objectkey
    objecttable = i_objecttable
    classnum    = i_classnum
    classtype   = i_classtype
    BINARY SEARCH.
    IF sy-subrc <> 0.
      CLEAR ls_ausp.
      ls_ausp-objectkey   = i_objectkey  .
      ls_ausp-objecttable = i_objecttable.
      ls_ausp-classnum    = i_classnum   .
      ls_ausp-classtype   = i_classtype  .
      ls_ausp-o_text = NEW zcl_text( 'AUSP' ).

*      " 特征取值相关表：
*      " AUSP，特征值表
*      " KSSK，KSSK-OBJEK = AUSP-OBJEK，简单理解为单对象分类，根据对象号关联特征
*      " INOB，INOB-CUOBJ = AUSP-OBJEK，多对象分类，根据内部对象号关联特征

*      " 存在键值重复的情况，无法对全部情况进行推导
*      " 一个键值可能对应不同业务，强行推导会让问题排查变得困难
*      " 如果觉得无所谓，倒是可以启用这段推导逻辑
*      IF ls_ausp-objecttable IS INITIAL
*      OR ls_ausp-classnum IS INITIAL
*      OR ls_ausp-classtype IS INITIAL.
*        " 先根据对象号推导
*        SELECT SINGLE
*          tcla~obtab AS objecttable,
*          klah~class AS classnum,
*          kssk~klart AS classtype
*          FROM kssk
*          JOIN tcla ON kssk~klart = tcla~klart
*          JOIN klah ON kssk~clint = klah~clint
*          WHERE kssk~objek = @ls_ausp-objectkey
*          INTO @DATA(ls_object_key).
*        IF sy-subrc <> 0.
*          " 再根据内部对象号推导
*          SELECT SINGLE
*            inob~obtab AS objecttable,
*            klah~class AS classnum,
*            inob~klart AS classtype
*            FROM inob
*            JOIN kssk ON inob~cuobj = kssk~objek
*            JOIN klah ON kssk~clint = klah~clint
*            WHERE inob~objek = @ls_ausp-objectkey
*            INTO @ls_object_key.
*        ENDIF.
*
*        IF ls_ausp-objecttable IS INITIAL.
*          ls_ausp-objecttable = ls_object_key-objecttable.
*        ENDIF.
*
*        IF ls_ausp-classnum IS INITIAL.
*          ls_ausp-classnum = ls_object_key-classnum.
*        ENDIF.
*
*        IF ls_ausp-classtype IS INITIAL.
*          ls_ausp-classtype = ls_object_key-classtype.
*        ENDIF.
*      ENDIF.

      DATA:
        lt_allocvaluesnum  TYPE STANDARD TABLE OF bapi1003_alloc_values_num,
        lt_allocvalueschar TYPE STANDARD TABLE OF bapi1003_alloc_values_char,
        lt_allocvaluescurr TYPE STANDARD TABLE OF bapi1003_alloc_values_curr,
        lt_return          TYPE STANDARD TABLE OF bapiret2.

      CALL FUNCTION 'BAPI_OBJCL_GETDETAIL'
        EXPORTING
          objectkey_long  = ls_ausp-objectkey
          objecttable     = ls_ausp-objecttable
          classnum        = ls_ausp-classnum
          classtype       = ls_ausp-classtype
        TABLES
          allocvaluesnum  = lt_allocvaluesnum
          allocvalueschar = lt_allocvalueschar
          allocvaluescurr = lt_allocvaluescurr
          return          = lt_return.

      " NUM(数字)，DATE(日期)，TIME(时间)
      LOOP AT lt_allocvaluesnum INTO DATA(ls_allocvaluesnum).
        " 获取出来的是FLOAT格式数据，需要额外进行转换
        INSERT VALUE #(
          key = ls_allocvaluesnum-charact
          value = |{ ls_allocvaluesnum-value_from NUMBER = RAW }|
        ) INTO TABLE ls_ausp-o_text->mt_text.
      ENDLOOP.

      " CHAR(字符)
      LOOP AT lt_allocvalueschar INTO DATA(ls_allocvalueschar).
        INSERT VALUE #(
          key = ls_allocvalueschar-charact
          value = ls_allocvalueschar-value_char_long
        ) INTO TABLE ls_ausp-o_text->mt_text.
      ENDLOOP.

      " CURR(金额)
      LOOP AT lt_allocvaluescurr INTO DATA(ls_allocvaluescurr).
        " 获取出来的是FLOAT格式数据，需要额外进行转换
        " 没遇过这种格式的数据，不知道要不要参考货币
        INSERT VALUE #(
          key = ls_allocvaluescurr-charact
          value = |{ ls_allocvaluesnum-value_from NUMBER = RAW }|
*          value = |{ ls_allocvaluesnum-value_from NUMBER = RAW CURRENCY = ls_allocvaluesnum-unit_from }|
        ) INTO TABLE ls_ausp-o_text->mt_text.
      ENDLOOP.

      INSERT ls_ausp INTO TABLE mt_ausp.
    ENDIF.

    ro_text = ls_ausp-o_text.

  ENDMETHOD.


  METHOD domain.

    READ TABLE mt_domains INTO DATA(ls_domain) WITH KEY domname = i_domname BINARY SEARCH.
    IF sy-subrc <> 0.
      CLEAR ls_domain.
      ls_domain-domname = i_domname.
      ls_domain-o_text = NEW zcl_text( 'DOMAIN' ).

      SELECT
        domvalue_l AS key,
        ddtext AS value
        FROM dd07t
        WHERE domname = @i_domname
          AND ddlanguage = '1'
          AND as4local = 'A'
        INTO TABLE @ls_domain-o_text->mt_text.

      INSERT ls_domain INTO TABLE mt_domains.
    ENDIF.
    ro_text = ls_domain-o_text.

  ENDMETHOD.


  METHOD get.

    CHECK i_key IS NOT INITIAL.
    CHECK m_name <> 'NOT_FOUND'.

    " 检查缓存
    READ TABLE mt_text INTO DATA(ls_text) WITH KEY key = i_key.
    IF sy-subrc = 0.
      r_value = ls_text-value.
      RETURN.
    ENDIF.

    TRY.
        " 跳转到对应方法处理
        CALL METHOD me->(m_method)
          EXPORTING
            i_key   = i_key
          RECEIVING
            r_value = r_value.
      CATCH cx_root.
    ENDTRY.

    " 缓存记录
    CLEAR ls_text.
    ls_text-key = i_key.
    ls_text-value = r_value.
    INSERT ls_text INTO TABLE mt_text.

  ENDMETHOD.


  METHOD long_text.

    " 想了下，还是不缓存了
    CALL FUNCTION 'READ_TEXT'
      EXPORTING
        id                      = i_id
        language                = i_language
        name                    = i_name
        object                  = i_object
      TABLES
        lines                   = et_tline
      EXCEPTIONS
        id                      = 1
        language                = 2
        name                    = 3
        not_found               = 4
        object                  = 5
        reference_check         = 6
        wrong_access_to_archive = 7.
    IF sy-subrc = 0.
      CALL FUNCTION 'IDMX_DI_TLINE_INTO_STRING'
        EXPORTING
          it_tline       = et_tline
        IMPORTING
          ev_text_string = r_value.
      IF e_value IS SUPPLIED.
        e_value = r_value.
      ENDIF.
    ENDIF.

  ENDMETHOD.


  METHOD _ausp.
  ENDMETHOD.


  METHOD _bp.

    SELECT SINGLE
      concat( name_org1, name_org2 ) AS name
      FROM but000
      WHERE partner = @i_key
      INTO @r_value.

  ENDMETHOD.


  METHOD _bukrs.

    SELECT SINGLE butxt FROM t001 WHERE bukrs = @i_key INTO @r_value.

  ENDMETHOD.


  METHOD _domain.
  ENDMETHOD.


  METHOD _lgort.

    SELECT SINGLE lgobe FROM t001l WHERE lgort = @i_key INTO @r_value.

  ENDMETHOD.


  METHOD _matnr.

    SELECT SINGLE maktx FROM makt WHERE matnr = @i_key AND spras = '1' INTO @r_value.

  ENDMETHOD.


  METHOD _not_found.
  ENDMETHOD.


  METHOD _prctr.

    SELECT SINGLE ltext FROM cepct WHERE spras = '1' AND prctr = @i_key INTO @r_value.

  ENDMETHOD.


  METHOD _user.

    SELECT SINGLE concat( adrp~name_first, adrp~name_last )
      FROM usr21
      JOIN adrp ON usr21~persnumber = adrp~persnumber
      WHERE usr21~bname = @i_key
      INTO @r_value.
    IF r_value IS INITIAL.
      r_value = i_key.
    ENDIF.

  ENDMETHOD.


  METHOD _waers.

    SELECT SINGLE ltext FROM tcurt WHERE spras = '1' AND waers = @i_key INTO @r_value.

  ENDMETHOD.


  METHOD _werks.

    SELECT SINGLE name1 FROM t001w WHERE werks = @i_key INTO @r_value.

  ENDMETHOD.
ENDCLASS.
```
  
</details>

<details>
<summary>测试用例</summary>

```ABAP

DATA l_value TYPE string.

" 示例1，取预留项
l_value = zcl_text=>bukrs->get( '0001' ).

" 示例2，通常取值
l_value = zcl_text=>create( 'WERKS' )->get( '0001' ).

" 示例3，取域值
l_value = zcl_text=>domain( 'XFELD' )->get( 'X' ).

" 示例4，取长文本
l_value = zcl_text=>long_text( i_id = 'Z001' i_name = '0010012345' i_object = 'VBBK' ).

" 示例5，取特征值
DATA ls_mara TYPE mara.
DATA(lo_ausp) = zcl_text=>create_ausp(
      i_objectkey   = |{ ls_mara-matnr }|
      i_objecttable = 'MARA'
*      i_classnum    = '' " 不填的话自动推导
      i_classtype   = '001' ). " 物料分类
l_value = lo_ausp->get( 'A0001' ).
l_value = lo_ausp->get( 'A0002' ).

```

</details>
