# 文本取值工具

## 自开发工具

报表部分字段需要取文本，这里将频率较高的字段整理出来，以后就不用重复写SQL查表了。

> ECC酌情使用，程序每次取值就通过\[SELECT SINGLE\]访问数据库，性能远不如直接批量查询。
>
> HANA性能有巨大提升，可以忽略这部分损失

<details>
<summary>ZCL_TEXT</summary>

``` abap
"! <p class="shorttext synchronized">文本取值工具</p>
class ZCL_TEXT definition
  public
  final
  create private .

public section.

    "! <p class="shorttext synchronized">文本工具类</p>
  constants MC_CLASS_NAME type SEOCLSNAME value 'ZCL_TEXT' ##NO_TEXT.
    "! <p class="shorttext synchronized">空值</p>
  constants MC_NONE type STRING value SPACE ##NO_TEXT.
    "! <p class="shorttext synchronized">自定义方法前缀</p>
  constants MC_CUSTOM_METHOD_PREFIX type STRING value '_' ##NO_TEXT.
    "! <p class="shorttext synchronized">动态SQL查询方法名</p>
  constants MC_METHOD_DYNAMIC_QUERY type ABAP_METHNAME value 'DYNAMIC_QUERY' ##NO_TEXT.
    "! <p class="shorttext synchronized">有效的空对象，防止程序运行错误</p>
  class-data NOT_FOUND type ref to ZCL_TEXT read-only .

  class-methods CLASS_CONSTRUCTOR .
    "! <p class="shorttext synchronized">设置取文本时所用语言</p>
  class-methods SET_LANGUAGE
    importing
      !I_LANGU type SY-LANGU .
    "! <p class="shorttext synchronized">创建自定义对象</p>
  class-methods CREATE_CUSTOM
    importing
      !I_NAME type STRING
    returning
      value(RO_TEXT) type ref to ZCL_TEXT .
    "! <p class="shorttext synchronized">创建动态SQL对象</p>
  class-methods CREATE_QUERY
    importing
      !I_NAME type STRING
      !I_TABNAME type TABNAME optional
      !I_SPRAS type FIELDNAME optional
      !I_KEY type FIELDNAME optional
      !I_TEXT type FIELDNAME optional
    returning
      value(RO_TEXT) type ref to ZCL_TEXT .
    "! <p class="shorttext synchronized">创建域值对象</p>
  class-methods CREATE_DOMAIN
    importing
      !I_DOMNAME type STRING
    returning
      value(RO_TEXT) type ref to ZCL_TEXT .
    "! <p class="shorttext synchronized">创建特征值对象</p>
  class-methods CREATE_OBJCL
    importing
      !I_OBJECTKEY type BAPI1003_KEY-OBJECT
      !I_OBJECTTABLE type BAPI1003_KEY-OBJECTTABLE optional
      !I_CLASSNUM type BAPI1003_KEY-CLASSNUM optional
      !I_CLASSTYPE type BAPI1003_KEY-CLASSTYPE optional
      !I_AUTO_COMPLETE type XFELD default ABAP_TRUE
    returning
      value(RO_TEXT) type ref to ZCL_TEXT .
    "! <p class="shorttext synchronized">长文本读取</p>
  class-methods LONG_TEXT
    importing
      !I_ID type THEAD-TDID
      !I_LANGUAGE type THEAD-TDSPRAS default SY-LANGU
      !I_NAME type THEAD-TDNAME
      !I_OBJECT type THEAD-TDOBJECT
    exporting
      !ET_TLINE type TLINETAB
      !E_VALUE type STRING
    returning
      value(R_VALUE) type STRING .
    "! <p class="shorttext synchronized">根据传入值自动获取文本（要求字段存在值表和文本表，否则会失败）</p>
  class-methods AUTO
    importing
      !I_KEY type DATA
    returning
      value(R_VALUE) type STRING .
    "! <p class="shorttext synchronized">获取文本</p>
  methods GET
    importing
      !I_KEY type DATA
    returning
      value(R_VALUE) type STRING .
  PROTECTED SECTION.
private section.

  types:
    BEGIN OF ty_text,
        key   TYPE string,
        value TYPE string,
      END OF ty_text .
  types:
    tt_text TYPE SORTED TABLE OF ty_text WITH NON-UNIQUE KEY key .
  types:
    BEGIN OF ty_instance,
        name   TYPE string,
        o_text TYPE REF TO ZCL_TEXT,
      END OF ty_instance .
  types:
    tt_instance TYPE SORTED TABLE OF ty_instance WITH NON-UNIQUE KEY name .
  types:
    BEGIN OF ty_objcl_instance,
        objectkey   TYPE bapi1003_key-object_long,
        objecttable TYPE bapi1003_key-objecttable,
        classnum    TYPE bapi1003_key-classnum,
        classtype   TYPE bapi1003_key-classtype,
        o_text      TYPE REF TO ZCL_TEXT,
      END OF ty_objcl_instance .
  types:
    tt_objcl_instance TYPE SORTED TABLE OF ty_objcl_instance WITH NON-UNIQUE KEY objectkey objecttable classnum classtype .
  types:
    BEGIN OF ty_custom_query,
        name    TYPE string,
        tabname TYPE tabname,
        spras   TYPE fieldname,
        key     TYPE fieldname,
        text    TYPE fieldname,
      END OF ty_custom_query .
  types:
    tt_custom_query TYPE SORTED TABLE OF ty_custom_query WITH NON-UNIQUE KEY name .

    "! <p class="shorttext synchronized">AUTO对象缓存</p>
  class-data MT_AUTO type TT_INSTANCE .
    "! <p class="shorttext synchronized">自定义对象缓存</p>
  class-data MT_CUSTOM type TT_INSTANCE .
    "! <p class="shorttext synchronized">域值对象缓存</p>
  class-data MT_DOMAIN type TT_INSTANCE .
    "! <p class="shorttext synchronized">动态SQL对象缓存</p>
  class-data MT_QUERY type TT_INSTANCE .
    "! <p class="shorttext synchronized">特征值对象缓存</p>
  class-data MT_OBJCL type TT_OBJCL_INSTANCE .
    "! <p class="shorttext synchronized">自定义动态查询参数</p>
  class-data MT_CUSTOM_QUERY type TT_CUSTOM_QUERY .
    "! <p class="shorttext synchronized">文本工具类描述对象</p>
  class-data MO_OBJECTDESCR type ref to CL_ABAP_OBJECTDESCR .
    "! <p class="shorttext synchronized">对象名称</p>
  data M_NAME type STRING .
    "! <p class="shorttext synchronized">取值缓存清单</p>
  data MT_TEXT type TT_TEXT .
    "! <p class="shorttext synchronized">自定义处理方法</p>
  data M_CUSTOM_METHOD type ABAP_METHNAME .
  data:
      "! <p class="shorttext synchronized">动态SQL参数</p>
    BEGIN OF ms_param,
        table TYPE tabname,
        spras TYPE fieldname,
        key   TYPE fieldname,
        text  TYPE fieldname,
      END OF ms_param .

    "! <p class="shorttext synchronized">自定义动态查询参数</p>
  class-methods CREATE_CUSTOM_QUERY .
    "! <p class="shorttext synchronized">CONSTRUCTOR</p>
  methods CONSTRUCTOR
    importing
      !I_NAME type STRING .
    "! <p class="shorttext synchronized">动态SQL查询</p>
  methods DYNAMIC_QUERY
    importing
      !I_KEY type DATA
    returning
      value(R_VALUE) type STRING .
    "! <p class="shorttext synchronized">获取用户名称</p>
  methods _SYST_UNAME
    importing
      !I_KEY type DATA
    returning
      value(R_VALUE) type STRING .
ENDCLASS.



CLASS ZCL_TEXT IMPLEMENTATION.


  METHOD auto.

    " 获取字段描述
    DATA(lo_typedescr) = cl_abap_typedescr=>describe_by_data( i_key ).
    IF lo_typedescr->kind <> cl_abap_typedescr=>kind_elem. " 只对数据元素进行处理
      RETURN.
    ENDIF.

    " 获取字段类型名称
    DATA l_rollname TYPE string.
    l_rollname = CAST cl_abap_elemdescr( lo_typedescr )->get_ddic_field( )-rollname.
    IF l_rollname IS INITIAL.
      RETURN.
    ENDIF.

    " 缓存检查
    READ TABLE mt_auto REFERENCE INTO DATA(lr_auto) WITH KEY name = l_rollname BINARY SEARCH.
    IF sy-subrc = 0.
      r_value = lr_auto->o_text->get( i_key ).
      RETURN.
    ELSE.
      INSERT VALUE #(
        name = l_rollname
        o_text = not_found
        ) INTO TABLE mt_auto REFERENCE INTO lr_auto.
    ENDIF.

    " 检查是否存在自定义处理方法
    lr_auto->o_text = create_custom( l_rollname ).
    IF lr_auto->o_text <> not_found.
      r_value = lr_auto->o_text->get( i_key ).
      RETURN.
    ENDIF.

    " 获取数据元素对应域和值表
    SELECT SINGLE
      rollname,
      domname,
      entitytab
      FROM dd04l
      WHERE rollname = @l_rollname
      INTO @DATA(ls_dd04l).
    IF sy-subrc <> 0.
      RETURN.
    ENDIF.

    " 检查是否存在域值
    lr_auto->o_text = create_domain( CONV #( ls_dd04l-domname ) ).
    IF lr_auto->o_text <> not_found.
      r_value = lr_auto->o_text->get( i_key ).
      RETURN.
    ENDIF.

    " 检查是否存在值表
    IF ls_dd04l-entitytab IS INITIAL.
      RETURN.
    ENDIF.

    " 获取值表对应文本表
    SELECT SINGLE tabname FROM dd08l
      WHERE checktable = @ls_dd04l-entitytab
        AND frkart = 'TEXT'
      INTO @DATA(l_texttab).
    IF sy-subrc <> 0.
      RETURN.
    ENDIF.

    " 获取值表结构
    SELECT
      position,
      fieldname,
      keyflag,
      rollname
      FROM dd03l
      WHERE tabname = @l_texttab
      INTO TABLE @DATA(lt_field).
    IF sy-subrc <> 0.
      RETURN.
    ENDIF.

    " 获取动态SQL查询所需参数
    DATA l_field_spras TYPE fieldname.
    DATA l_field_key TYPE fieldname.
    DATA l_field_text TYPE fieldname.
    SORT lt_field BY position.
    LOOP AT lt_field INTO DATA(ls_field).
      IF ls_field-keyflag = 'X'.
        " 获取关键字段中的键值字段
        IF ls_field-rollname = l_rollname.
          l_field_key = ls_field-fieldname.
        ENDIF.
        " 获取关键字段中的语言字段
        IF ls_field-rollname = 'SPRAS'.
          l_field_spras = ls_field-fieldname.
        ENDIF.
      ELSE.
        " 获取非键值的第一个字段作为文本字段
        l_field_text = ls_field-fieldname.
      ENDIF.
    ENDLOOP.
    IF l_field_key IS INITIAL OR l_field_text IS INITIAL.
      RETURN.
    ENDIF.

    " 创建动态查询
    lr_auto->o_text = create_query(
      i_name = l_rollname
      i_tabname = l_texttab
      i_spras = l_field_spras
      i_key = l_field_key
      i_text = l_field_text
    ).

    r_value = lr_auto->o_text->get( i_key ). " 返回查询结果

  ENDMETHOD.


  METHOD class_constructor.

    " 分析自身，获取可以提供的特殊文本处理方法
    mo_objectdescr ?= cl_abap_typedescr=>describe_by_name( mc_class_name ).
    " 创建有效的空值对象，防止程序运行错误
    not_found = NEW #( mc_none ).

  ENDMETHOD.


  METHOD constructor.

    m_name = i_name.

  ENDMETHOD.


  METHOD create_custom.

    READ TABLE mt_custom REFERENCE INTO DATA(lr_custom) WITH KEY name = i_name BINARY SEARCH.
    IF sy-subrc <> 0.
      INSERT VALUE #(
        name = i_name
      ) INTO TABLE mt_custom REFERENCE INTO lr_custom.
      " 约定自定义处理方法为【前缀+名称】，外部调用时，传入名称即可
      DATA l_method TYPE abap_methname.
      l_method = |{ mc_custom_method_prefix }{ i_name CASE = UPPER }|.
      READ TABLE mo_objectdescr->methods TRANSPORTING NO FIELDS WITH KEY name = l_method BINARY SEARCH.
      IF sy-subrc = 0.
        lr_custom->o_text = NEW #( i_name ).
        lr_custom->o_text->m_custom_method = l_method.
      ELSE.
        " 第一次调用先获取配置数据
        IF mt_custom_query IS INITIAL.
          create_custom_query( ).
        ENDIF.
        " 检查配置是否有定义查询
        READ TABLE mt_custom_query REFERENCE INTO DATA(lr_custom_query) WITH KEY name = i_name BINARY SEARCH.
        IF sy-subrc = 0.
          lr_custom->o_text = create_query(
            i_name    = lr_custom_query->name
            i_tabname = lr_custom_query->tabname
            i_spras   = lr_custom_query->spras
            i_key     = lr_custom_query->key
            i_text    = lr_custom_query->text
          ).
        ELSE.
          " 都没有，返回查询失败
          lr_custom->o_text = not_found.
        ENDIF.
      ENDIF.
    ENDIF.
    ro_text = lr_custom->o_text.

  ENDMETHOD.


  METHOD create_custom_query.

    " 可以弄配置表，我这边为了方便迁移，直接写死
    mt_custom_query = VALUE #(
      ( name = 'BUKRS'   tabname = 'T001'   key = 'BUKRS'   text = 'BUTXT' ) " 公司
      ( name = 'MATNR'   tabname = 'MAKT'   key = 'MATNR'   text = 'MAKTX' spras = 'SPRAS' ) " 物料
      ( name = 'MATKL'   tabname = 'T023T'  key = 'MATKL'   text = 'WGBEZ' spras = 'SPRAS' ) " 物料组
      ( name = 'PARTNER' tabname = 'BUT000' key = 'PARTNER' text = 'CONCAT( NAME_ORG1, NAME_ORG2 )' ) " 业务伙伴
      ( name = 'KUNNR'   tabname = 'KNA1'   key = 'KUNNR'   text = 'CONCAT( NAME1, NAME2 )' ) " 业务伙伴
      ( name = 'LIFNR'   tabname = 'LFA1'   key = 'LIFNR'   text = 'CONCAT( NAME1, NAME2 )' ) " 供应商
      ( name = 'WERKS'   tabname = 'T001W'  key = 'WERKS'   text = 'NAME1' ) " 工厂
      ( name = 'LGORT'   tabname = 'T001L'  key = 'LGORT'   text = 'LGOBE' ) " 库位
      ( name = 'PRCTR'   tabname = 'CEPCT'  key = 'PRCTR'   text = 'LTEXT' spras = 'SPRAS' ) " 利润中心
      ( name = 'WAERS'   tabname = 'TCURT'  key = 'WAERS'   text = 'LTEXT' spras = 'SPRAS' ) " 货币
    ).

  ENDMETHOD.


  METHOD create_domain.

    READ TABLE mt_domain REFERENCE INTO DATA(lr_domain) WITH KEY name = i_domname BINARY SEARCH.
    IF sy-subrc <> 0.
      INSERT VALUE #(
        name = i_domname
      ) INTO TABLE mt_domain REFERENCE INTO lr_domain.
      DATA lt_text TYPE tt_text.
      SELECT
        domvalue_l AS key,
        ddtext AS value
        FROM dd07t
        WHERE domname = @i_domname
          AND ddlanguage = @sy-langu
          AND as4local = 'A'
        INTO TABLE @lt_text.
      IF sy-subrc = 0.
        lr_domain->o_text = NEW #( i_domname ).
        lr_domain->o_text->mt_text = lt_text.
      ELSE.
        lr_domain->o_text = not_found.
      ENDIF.
    ENDIF.
    ro_text = lr_domain->o_text.

  ENDMETHOD.


  METHOD create_objcl.

    READ TABLE mt_objcl REFERENCE INTO DATA(lr_objcl) WITH KEY
    objectkey   = i_objectkey
    objecttable = i_objecttable
    classnum    = i_classnum
    classtype   = i_classtype
    BINARY SEARCH.
    IF sy-subrc <> 0.
      INSERT VALUE #(
        objectkey   = i_objectkey
        objecttable = i_objecttable
        classnum    = i_classnum
        classtype   = i_classtype
        o_text      = NEW #( CONV #( i_objectkey ) )
      ) INTO TABLE mt_objcl REFERENCE INTO lr_objcl.

      DATA ls_objcl_key TYPE bapi1003_key.
      ls_objcl_key-object_long = lr_objcl->objectkey.
      ls_objcl_key-objecttable = lr_objcl->objecttable.
      ls_objcl_key-classnum = lr_objcl->classnum.
      ls_objcl_key-classtype = lr_objcl->classtype.

      " 存在键值重复的情况，无法对全部情况进行推导
      " 一个键值可能对应不同业务，强行推导会让问题排查变得困难
      " 如果觉得无所谓，倒是可以启用这段推导逻辑
      IF i_auto_complete = abap_true.
        " 特征取值相关表：
        " AUSP，特征值表
        " KSSK，KSSK-OBJEK = AUSP-OBJEK，简单理解为单对象分类，根据对象号关联特征
        " INOB，INOB-CUOBJ = AUSP-OBJEK，多对象分类，根据内部对象号关联特征
        IF ls_objcl_key-objecttable IS INITIAL
        OR ls_objcl_key-classnum IS INITIAL
        OR ls_objcl_key-classtype IS INITIAL.
          " 先根据对象号推导
          SELECT SINGLE
            tcla~obtab AS objecttable,
            klah~class AS classnum,
            kssk~klart AS classtype
            FROM kssk
            JOIN tcla ON kssk~klart = tcla~klart
            JOIN klah ON kssk~clint = klah~clint
            WHERE kssk~objek = @ls_objcl_key-object_long
            INTO @DATA(ls_object_key).
          IF sy-subrc <> 0.
            " 再根据内部对象号推导
            SELECT SINGLE
              inob~obtab AS objecttable,
              klah~class AS classnum,
              inob~klart AS classtype
              FROM inob
              JOIN kssk ON inob~cuobj = kssk~objek
              JOIN klah ON kssk~clint = klah~clint
              WHERE inob~objek = @ls_objcl_key-object_long
              INTO @ls_object_key.
          ENDIF.

          IF ls_objcl_key-objecttable IS INITIAL.
            ls_objcl_key-objecttable = ls_object_key-objecttable.
          ENDIF.

          IF ls_objcl_key-classnum IS INITIAL.
            ls_objcl_key-classnum = ls_object_key-classnum.
          ENDIF.

          IF ls_objcl_key-classtype IS INITIAL.
            ls_objcl_key-classtype = ls_object_key-classtype.
          ENDIF.
        ENDIF.
      ENDIF.

      DATA:
        lt_allocvaluesnum  TYPE STANDARD TABLE OF bapi1003_alloc_values_num,
        lt_allocvalueschar TYPE STANDARD TABLE OF bapi1003_alloc_values_char,
        lt_allocvaluescurr TYPE STANDARD TABLE OF bapi1003_alloc_values_curr,
        lt_return          TYPE STANDARD TABLE OF bapiret2.

      CALL FUNCTION 'BAPI_OBJCL_GETDETAIL'
        EXPORTING
          objectkey_long  = ls_objcl_key-object_long
          objecttable     = ls_objcl_key-objecttable
          classnum        = ls_objcl_key-classnum
          classtype       = ls_objcl_key-classtype
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
        ) INTO TABLE lr_objcl->o_text->mt_text.
      ENDLOOP.

      " CHAR(字符)
      LOOP AT lt_allocvalueschar INTO DATA(ls_allocvalueschar).
        INSERT VALUE #(
          key = ls_allocvalueschar-charact
          value = ls_allocvalueschar-value_char_long
        ) INTO TABLE lr_objcl->o_text->mt_text.
      ENDLOOP.

      " CURR(金额)
      LOOP AT lt_allocvaluescurr INTO DATA(ls_allocvaluescurr).
        " 获取出来的是FLOAT格式数据，需要额外进行转换
        " 没遇过这种格式的数据，不知道要不要参考货币
        INSERT VALUE #(
          key = ls_allocvaluescurr-charact
          value = |{ ls_allocvaluesnum-value_from NUMBER = RAW }|
        ) INTO TABLE lr_objcl->o_text->mt_text.
      ENDLOOP.
    ENDIF.

    ro_text = lr_objcl->o_text.

  ENDMETHOD.


  METHOD create_query.

    READ TABLE mt_query REFERENCE INTO DATA(lr_query) WITH KEY name = i_name BINARY SEARCH.
    IF sy-subrc <> 0.
      INSERT VALUE #(
        name = i_name
        o_text = NEW #( i_name )
      ) INTO TABLE mt_query REFERENCE INTO lr_query.
      lr_query->o_text->m_custom_method = mc_method_dynamic_query.
      lr_query->o_text->ms_param-table = i_tabname.
      lr_query->o_text->ms_param-spras = i_spras.
      lr_query->o_text->ms_param-key = i_key.
      lr_query->o_text->ms_param-text = i_text.
    ENDIF.
    ro_text = lr_query->o_text.

  ENDMETHOD.


  METHOD dynamic_query.

    CHECK ms_param IS NOT INITIAL.
    DATA l_where TYPE string.
    l_where = |{ ms_param-key } = @I_KEY|. " 拼接查询条件
    IF ms_param-spras IS NOT INITIAL. " 如果有语言条件也加上
      l_where = |{ ms_param-spras } = @SY-LANGU AND { l_where }|.
    ENDIF.
    TRY.
        SELECT SINGLE (ms_param-text) FROM (ms_param-table) WHERE (l_where) INTO @r_value.
      CATCH cx_root.
        CLEAR ms_param. " 查询失败，不允许继续查询
    ENDTRY.

  ENDMETHOD.


  METHOD get.

    CHECK i_key IS NOT INITIAL.
    " 缓存检查
    READ TABLE mt_text REFERENCE INTO DATA(lr_text) WITH KEY key = i_key.
    IF sy-subrc = 0.
      r_value = lr_text->value.
      RETURN.
    ENDIF.

    " 检查并调用特殊处理方法
    IF m_custom_method IS NOT INITIAL.
      TRY.
          CALL METHOD me->(m_custom_method)
            EXPORTING
              i_key   = i_key
            RECEIVING
              r_value = r_value.
        CATCH cx_root.
          m_custom_method = mc_none. " 报错后不允许继续使用
          RETURN.
      ENDTRY.

      INSERT VALUE #( " 缓存记录
        key = i_key
        value = r_value
      ) INTO TABLE mt_text.
    ENDIF.

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


  METHOD set_language.

    TRY.
        SET LOCALE LANGUAGE i_langu.
      CATCH cx_sy_localization_error INTO DATA(lx_sy_localization_error).
        MESSAGE lx_sy_localization_error->get_text( ) TYPE 'S' DISPLAY LIKE 'E'.
    ENDTRY.

  ENDMETHOD.


  METHOD _syst_uname.

    SELECT SINGLE concat( adrp~name_first, adrp~name_last )
      FROM usr21
      JOIN adrp ON usr21~persnumber = adrp~persnumber
      WHERE usr21~bname = @i_key
      INTO @r_value.
    IF r_value IS INITIAL.
      r_value = i_key.
    ENDIF.

  ENDMETHOD.
ENDCLASS.

```
  
</details>

<details open>
<summary>测试用例</summary>

```ABAP

" 根据传入值推理
DATA(l_text)  = ycl_text=>auto( abap_true ). " 基础类型，推导失败，返回空值
DATA(l_text1) = ycl_text=>auto( CONV xfeld( 'X' ) ). " 域值
DATA(l_text2) = ycl_text=>auto( CONV blart( 'RV' ) ). " 数据元素-值表-文本表
DATA(l_text3) = ycl_text=>auto( sy-uname ). " 自定义查询1
DATA(l_text4) = ycl_text=>auto( CONV bukrs( '0001' ) ). " 自定义查询2

" 如果传入基础类型数据，或者传入值没有域值、值表、文本表、自定义查询等
" AUTO不能生效，此时可以直接指定查询
DATA(l_text5) = ycl_text=>create_domain( 'XFELD' )->get( 'X' ). " 域值
DATA(l_text6) = ycl_text=>create_query( " 自定义查询3
                  i_name    = 'DEMO_QUERY'
                  i_tabname = 'T001'
                  i_key     = 'BUKRS'
                  i_text    = 'BUTXT' )->get( '0001' ).
DATA(l_text7) = ycl_text=>create_custom( 'BUKRS' )->get( '0001' ). " 自定义查询4

```

</details>

## XCO库

最近在研究XCO库，结论是无法用来快速取域值，可惜，下面是用XCO库取域值描述的两种方法：

<details>
  <summary>示例代码</summary>

```ABAP

*&---------------------------------------------------------------------*
*& 方法1，快速取值，但只能取创建域值时的文本描述
*&---------------------------------------------------------------------*
DATA(lo_domain) = xco_abap_repository=>object->doma->for( '$DOMAIN_NAME$' ).
IF lo_domain->fixed_value( '01' )->exists( ) = abap_true.
  DATA(lv_description) = lo_domain->fixed_value( '01' )->content( )->get_description( ).
ENDIF.

*&---------------------------------------------------------------------*
*& 方法2，取其他语言的域值描述
*&---------------------------------------------------------------------*
DATA(lo_text_attribute) = xco_domain=>text_attribute->fixed_value_description.
DATA(lo_target) = xco_i18n=>target->domain->fixed_value(
  iv_domain_name = '$DOMAIN_NAME$'
  iv_lower_limit = '01'
).

DATA(lo_language) = xco=>language( 'E' ).
DATA(lo_translation) = lo_target->get_translation(
  io_language        = lo_language
  it_text_attributes = VALUE #( ( lo_text_attribute ) )
).

LOOP AT lo_translation->texts INTO DATA(lo_text).
  DATA(lv_value) = lo_text_attribute->if_xco_i18n_text_attribute~get_string_for_text( lo_text->value ).
ENDLOOP.


```

</details>

## 基于XCO库的域值取值工具

简单封装下：

<details>
  <summary>LCL_DOMAIN</summary>

```ABAP

CLASS lcl_domain DEFINITION.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_domain_name TYPE sxco_ad_object_name.
    METHODS language IMPORTING iv_language      TYPE spras
                     RETURNING VALUE(ro_result) TYPE REF TO lcl_domain.
    METHODS fixed_value IMPORTING iv_lower_limit   TYPE if_xco_domain_fixed_value=>tv_lower_limit
                        RETURNING VALUE(rv_result) TYPE string .
  PRIVATE SECTION.
    TYPES:
      BEGIN OF ty_target,
        lower_limit TYPE if_xco_domain_fixed_value=>tv_lower_limit,
        fixed_value TYPE REF TO if_xco_i18n_dm_target_fixed_va,
      END OF ty_target.
    DATA mt_target TYPE SORTED TABLE OF ty_target WITH UNIQUE KEY lower_limit.
    DATA mo_language TYPE REF TO if_xco_language.
    DATA mo_text_attribute TYPE REF TO cl_xco_domain_text_attribute.
    DATA mv_domain_name TYPE sxco_ad_object_name.
ENDCLASS.

CLASS lcl_domain IMPLEMENTATION.
  METHOD constructor.
    mo_text_attribute = xco_domain=>text_attribute->fixed_value_description.
    mv_domain_name = iv_domain_name.
    me->language( sy-langu ).
  ENDMETHOD.
  
  METHOD language.
    mo_language = xco=>language( iv_language ).
    ro_result = me.
  ENDMETHOD.
  
  METHOD fixed_value.
    READ TABLE mt_target REFERENCE INTO DATA(lr_target) WITH KEY lower_limit = iv_lower_limit BINARY SEARCH.
    IF sy-subrc <> 0.
      INSERT VALUE #( lower_limit = iv_lower_limit ) INTO TABLE mt_target REFERENCE INTO lr_target.
      lr_target->fixed_value = xco_i18n=>target->domain->fixed_value(
        iv_domain_name = mv_domain_name
        iv_lower_limit = iv_lower_limit
      ).
    ENDIF.
    DATA(lo_target) = lr_target->fixed_value.
    DATA(lo_translation) = lo_target->get_translation(
      io_language        = mo_language
      it_text_attributes = VALUE #( ( mo_text_attribute ) ) ).
    LOOP AT lo_translation->texts INTO DATA(lo_text).
      rv_result = mo_text_attribute->if_xco_i18n_text_attribute~get_string_for_text( lo_text->value ).
    ENDLOOP.
  ENDMETHOD.
ENDCLASS.

```

</details>

<details open>
  <summary>测试用例</summary>

```ABAP

DATA(lv_value_zh) = NEW lcl_domain( '$DOMAIN_NAME$' )->fixed_value( '01' ).
DATA(lv_value_en) = NEW lcl_domain( '$DOMAIN_NAME$' )->language( 'E' )->fixed_value( '01' ).

```

</details>
