# 日志查询程序

该程序用于查询接口日志，并已加入PO日志查询（仅限系统内存储的日志数据），如有自定义日志数据想要展示，需要继承本地接口LIF_LOG，并实施接口方法。

> 报表执行时会检索实例类，因此无需手工创建新的日志实例（CREATE OBJECT，NEW #()等）。

<details>
  <summary>示例代码</summary>

```ABAP

*&---------------------------------------------------------------------*
*& REPORT ZLOGREPORT
*&---------------------------------------------------------------------*
*& V2 - XIAOFENG - 2022-09-26 14:11:17
*& 上个项目的那版写得太复杂，无法扩展，这次乘机简化下代码
*& 使用步骤：
*&  1 代码复制粘贴
*&  2 创建9000屏幕，添加一个容器（属性改自适应），命名CON_9000
*&  3 创建状态栏STATUS
*&   3.1 添加三个退出按钮（&F03\&F15\&F12）
*&   3.2 添加REDO按钮，用于错误数据重处理，没有的话忽略即可
*&  4 新建实施类，继承接口LIF_LOG，把接口方法实施即可
*&   4.1 GET_LOG_KIND，为每种日志设定唯一名称
*&   4.2 GET_DATA，查询日志数据，写入到GT_LOG和GT_LOG_RAWDATA中（弹窗用）
*&   4.3 REDO，错误重处理
*&---------------------------------------------------------------------*
REPORT ZLOGREPORT

*&---------------------------------------------------------------------*
*& 本地类声明
*&---------------------------------------------------------------------*
CLASS lcl_progress DEFINITION DEFERRED. " 进度条
" 数据处理相关
INTERFACE lif_unit_parser DEFERRED.
CLASS lcl_data_unit_parser DEFINITION DEFERRED.
CLASS lcl_json_unit_parser DEFINITION DEFERRED.
CLASS lcl_xml_unit_parser DEFINITION DEFERRED.
CLASS lcl_unit_helper DEFINITION DEFERRED.
" ALV相关
INTERFACE lif_alv DEFERRED.
CLASS lcl_alv_logh DEFINITION DEFERRED. " 日志抬头数据展示
CLASS lcl_alv_unit DEFINITION DEFERRED. " 单元数据展示
CLASS lcl_alv_flat DEFINITION DEFERRED. " 扁平结构展示
" 日志处理相关
INTERFACE lif_log DEFERRED.
CLASS lcl_log_po DEFINITION DEFERRED. " PO日志
CLASS lcl_log_custom DEFINITION DEFERRED. " 自定义日志

*&---------------------------------------------------------------------*
*& 类型定义
*&---------------------------------------------------------------------*
" 数据单元，简单来说，一个值就是一个单元
TYPES:
  BEGIN OF ty_unit,
    path  TYPE string, " 路径
    key   TYPE string, " 键
    value TYPE string, " 值
  END OF ty_unit.
TYPES tt_unit TYPE STANDARD TABLE OF ty_unit WITH EMPTY KEY.
" 扁平结构信息
TYPES:
  BEGIN OF ty_flatdt,
    struct   TYPE string, " 结构
    field    TYPE string, " 字段
    position TYPE i, " 位置
  END OF ty_flatdt.
TYPES tt_flatdt TYPE STANDARD TABLE OF ty_flatdt WITH EMPTY KEY.
" 数据单元扩展
TYPES:
  BEGIN OF ty_unitex, " 创建扁平结构用到
    struct TYPE string, " 结构
    path   TYPE string, " 路径
    key    TYPE string, " 键
    value  TYPE string, " 值
  END OF ty_unitex.
TYPES tt_unitex TYPE STANDARD TABLE OF ty_unitex WITH EMPTY KEY.
" 日志抬头信息
TYPES:
  BEGIN OF ty_log_head,
    uuid      TYPE sysuuid_c32, " 日志ID
    zitem     TYPE i, " 序号
    log_kind  TYPE c LENGTH 20, " 日志种类，如PI日志，日志等多种
    intf_id   TYPE c LENGTH 30, " 接口标识
    func_name TYPE rs38l_fnam, " 函数名
    func_text TYPE c LENGTH 40, " 函数描述
    ztext     TYPE c LENGTH 255, " 附加信息，有些接口会在记录的时候附加一些描述说明
    io_flag   TYPE c LENGTH 10, " 入参或出参
    zconut    TYPE i, " 条目统计
    zsender   TYPE c LENGTH 20, " 发送方
    zreceiver TYPE c LENGTH 20, " 接受方
    zraw_icon TYPE icon_d, " 双击展示原始数据
    zdate     TYPE datum, " 日期
    ztime     TYPE uzeit, " 时间
    zuser     TYPE uname, " 用户
    mtype     TYPE bapi_mtype, " 状态
    msg       TYPE bapi_msg, " 消息文本
    rcol      TYPE c LENGTH 4, " 行颜色
    t_scol    TYPE lvc_t_scol, " 单元格颜色
    t_styl    TYPE lvc_t_styl, " 单元格样式
  END OF ty_log_head.
" 日志数据
TYPES:
  BEGIN OF ty_log_data,
*    r_data     TYPE REF TO data, " 日志数据
    t_unit     TYPE tt_unit, " 数据单元
    r_flatdata TYPE REF TO data, " 扁平结构数据
    t_flatdt   TYPE tt_flatdt, " 扁平结构
  END OF ty_log_data.
TYPES:
  BEGIN OF ty_log.
    INCLUDE TYPE ty_log_head.
    INCLUDE TYPE ty_log_data.
TYPES:
  END OF ty_log.
TYPES tt_log TYPE STANDARD TABLE OF ty_log .
" 日志原始数据
TYPES:
  BEGIN OF ty_log_rawdata,
    uuid    TYPE sysuuid_c32, " 日志ID
    zitem   TYPE i, " 序号
    zformat TYPE c LENGTH 10, " 原始数据格式
    zraw    TYPE string, " 原始数据
    zrawx   TYPE xstring, " 原始数据
  END OF ty_log_rawdata.
TYPES tt_log_rawdata TYPE STANDARD TABLE OF ty_log_rawdata .

TYPES tt_uuid TYPE STANDARD TABLE OF ty_log_head-uuid.
TYPES tt_uuid_opt TYPE RANGE OF ty_log_head-uuid.

*&---------------------------------------------------------------------*
*& 数据声明
*&---------------------------------------------------------------------*
DATA gt_log TYPE tt_log. " 日志数据
DATA gt_log_rawdata TYPE tt_log_rawdata. " 日志数据
DATA gt_log_impl TYPE STANDARD TABLE OF REF TO lif_log.

DATA go_alv TYPE REF TO lif_alv. " ALV对象
DATA go_container TYPE REF TO cl_gui_container.
DATA go_grid TYPE REF TO cl_gui_alv_grid.

DATA:
  BEGIN OF gs_fieldname,
    fdlk  TYPE string VALUE 'FDLK', " FLAT_DATA_LINE_KIND
    path  TYPE string VALUE 'PATH',
    field TYPE string VALUE '__FIELD',
  END OF gs_fieldname.

DATA:
  BEGIN OF gs_fdlk,
    header TYPE string VALUE 'HEADER',
    data   TYPE string VALUE 'DATA',
  END OF gs_fdlk.

DATA:
  BEGIN OF gs_color,
    blue        TYPE lvc_s_colo,
    yellow      TYPE lvc_s_colo,
    green       TYPE lvc_s_colo,
    red         TYPE lvc_s_colo,
    dept_blue   TYPE lvc_s_colo,
    dept_yellow TYPE lvc_s_colo,
    dept_green  TYPE lvc_s_colo,
    dept_red    TYPE lvc_s_colo,
  END OF gs_color.

*&---------------------------------------------------------------------*
*& 选择屏幕
*&---------------------------------------------------------------------*
TABLES sxmspmast. " PO相关
TABLES sxmspemas. " PO相关
" 选择条件
DATA:
  BEGIN OF gs_selection.
    INCLUDE TYPE ty_log_head.
DATA:
    intfid TYPE char30, " 自定义日志接口标识
*    INCLUDE TYPE ty_unit.
    field TYPE char30, " TY_UNIT-FIELD，STRING类型的，不能使用
    value TYPE char30. " TY_UNIT-VALUE，STRING类型的，不能使用
DATA:
  END OF gs_selection.
" 自定义选择条件
SELECTION-SCREEN BEGIN OF BLOCK b900 WITH FRAME TITLE b900.
  PARAMETERS p_custom TYPE xflag AS CHECKBOX DEFAULT 'X'.
  SELECT-OPTIONS s_intfid FOR gs_selection-intfid.
SELECTION-SCREEN END OF BLOCK b900.
" 通用选择条件
SELECTION-SCREEN BEGIN OF BLOCK b100 WITH FRAME TITLE b100.
  SELECT-OPTIONS s_uuid FOR gs_selection-uuid.
  SELECT-OPTIONS s_func FOR gs_selection-func_name MATCHCODE OBJECT sfunc_modules.
  SELECT-OPTIONS s_snd FOR gs_selection-zsender.
  SELECT-OPTIONS s_rcv FOR gs_selection-zreceiver.
  SELECT-OPTIONS s_user FOR gs_selection-zuser MATCHCODE OBJECT user_comp.
  SELECT-OPTIONS s_date FOR gs_selection-zdate NO-EXTENSION OBLIGATORY DEFAULT sy-datum.
  SELECT-OPTIONS s_time FOR gs_selection-ztime NO-EXTENSION.
  SELECT-OPTIONS s_mtype FOR gs_selection-mtype.
  " PO选择条件
  SELECTION-SCREEN BEGIN OF BLOCK b102 WITH FRAME TITLE b102.
    PARAMETERS p_po TYPE xflag AS CHECKBOX DEFAULT 'X'.
    SELECT-OPTIONS s_siname FOR sxmspemas-ob_name.
  SELECTION-SCREEN END OF BLOCK b102.
  " 扩展选择条件
  SELECTION-SCREEN BEGIN OF BLOCK b101 WITH FRAME TITLE b101.
    SELECT-OPTIONS s_field FOR gs_selection-field.
    SELECT-OPTIONS s_value FOR gs_selection-value.
  SELECTION-SCREEN END OF BLOCK b101.
SELECTION-SCREEN END OF BLOCK b100.
" 展示方式
SELECTION-SCREEN BEGIN OF BLOCK b200 WITH FRAME TITLE b200.
  PARAMETERS p_logh RADIOBUTTON GROUP rg1 TYPE xflag DEFAULT 'X'.
  PARAMETERS p_flat RADIOBUTTON GROUP rg1 TYPE xflag.
  PARAMETERS p_unit RADIOBUTTON GROUP rg1 TYPE xflag.
  SELECTION-SCREEN BEGIN OF BLOCK b201 WITH FRAME TITLE b201.
    PARAMETERS p_ctl1 TYPE xflag AS CHECKBOX. " 紧凑表示
    PARAMETERS p_ctl2 TYPE xflag AS CHECKBOX DEFAULT 'X'.
    PARAMETERS p_ctl3 TYPE xflag AS CHECKBOX DEFAULT 'X'.
    PARAMETERS p_ctl4 TYPE xflag AS CHECKBOX DEFAULT 'X'.
    PARAMETERS p_ctl5 TYPE i DEFAULT 1.
  SELECTION-SCREEN END OF BLOCK b201.
SELECTION-SCREEN END OF BLOCK b200.

*&---------------------------------------------------------------------*
*& 本地类定义
*&---------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*& CLASS LCL_PROGRESS
*&---------------------------------------------------------------------*
CLASS lcl_progress DEFINITION FINAL.
  PUBLIC SECTION.
    DATA m_total TYPE i.
    DATA m_current TYPE i.
    DATA m_time_start TYPE timestampl.
    DATA m_time TYPE timestampl.
    DATA m_interval TYPE i.
    DATA m_name TYPE string .
    METHODS start " 初始化
      IMPORTING total         TYPE i OPTIONAL
      RETURNING VALUE(result) TYPE REF TO lcl_progress.
    METHODS next " 增加一点进度
      IMPORTING delta         TYPE i DEFAULT 1
      RETURNING VALUE(result) TYPE REF TO lcl_progress.
    METHODS finish " 结束
      RETURNING VALUE(result) TYPE REF TO lcl_progress.
    METHODS show " 左下角消息
      IMPORTING text TYPE string OPTIONAL.
    METHODS percentage " 当前进度
      RETURNING VALUE(result) TYPE f.
    METHODS duration  " 运行时间
      RETURNING VALUE(result) TYPE f.
    CLASS-METHODS step " 展示单个条目
      IMPORTING text TYPE string OPTIONAL.
ENDCLASS.
*&---------------------------------------------------------------------*
*& CLASS (IMPLEMENTATION) LCL_PROGRESS
*&---------------------------------------------------------------------*
CLASS lcl_progress IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& START
*&---------------------------------------------------------------------*
  METHOD start.
    result = me.
    m_total = total.
    IF m_interval = 0.
      m_interval = 1. " 不加限制反而影响性能
    ENDIF.
    m_current = 0.
    GET TIME STAMP FIELD m_time_start.
    m_time = m_time_start.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& NEXT
*&---------------------------------------------------------------------*
  METHOD next.
    result = me.
    m_current = m_current + delta.

    DATA l_time TYPE timestampl.
    GET TIME STAMP FIELD l_time.
    IF m_current = m_total.
      m_time = l_time.
    ENDIF.

    IF m_time <= l_time.
      show( ).
      IF m_interval > 0.
        m_time = cl_abap_tstmp=>add( tstmp = l_time
                                     secs  = m_interval ).
      ELSE.
        m_time = l_time.
      ENDIF.
    ENDIF.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& FINISH
*&---------------------------------------------------------------------*
  METHOD finish.
    result = me.
    GET TIME STAMP FIELD m_time.
    show( ).
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SHOW
*&---------------------------------------------------------------------*
  METHOD show.
    DATA(l_text) = text.
    IF l_text IS INITIAL.
      l_text = |{ percentage( ) DECIMALS = 0 }% [ {
          m_current NUMBER = USER } / { m_total NUMBER = USER } ] {
          duration( ) DECIMALS = 0 }S|.
      IF m_name IS NOT INITIAL.
        l_text = |{ m_name } : { l_text }|.
      ENDIF.
    ENDIF.
    IF sy-batch = ''.
      CALL FUNCTION 'SAPGUI_PROGRESS_INDICATOR'
        EXPORTING
          text = l_text.
    ELSE.
      MESSAGE l_text TYPE 'S'.
    ENDIF.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& PERCENTAGE
*&---------------------------------------------------------------------*
  METHOD percentage.
    IF m_total <> 0.
      result = m_current / m_total * 100.
    ENDIF.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& DURATION
*&---------------------------------------------------------------------*
  METHOD duration.
    result = cl_abap_tstmp=>subtract( tstmp1 = m_time tstmp2 = m_time_start ).
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& STEP
*&---------------------------------------------------------------------*
  METHOD step.
    CALL FUNCTION 'SAPGUI_PROGRESS_INDICATOR'
      EXPORTING
        text = text.
  ENDMETHOD.

ENDCLASS.
*&---------------------------------------------------------------------*
*& LIF_UNIT_PARSER DEFINITION
*&---------------------------------------------------------------------*
INTERFACE lif_unit_parser.
  METHODS parse RETURNING VALUE(rt_result) TYPE tt_unit.
ENDINTERFACE.
*&---------------------------------------------------------------------*
*& LCL_DATA_UNIT_PARSER DEFINITION
*&---------------------------------------------------------------------*
CLASS lcl_data_unit_parser DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_unit_parser.
    METHODS constructor IMPORTING ir_data TYPE REF TO data.
  PRIVATE SECTION.
    DATA mr_data TYPE REF TO data.
    DATA mt_unit TYPE tt_unit.
    METHODS _parse
      IMPORTING ir_data      TYPE REF TO data
                i_path       TYPE string DEFAULT '$'
                i_name       TYPE string OPTIONAL
                io_typedescr TYPE REF TO cl_abap_typedescr OPTIONAL.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_JSON_UNIT_PARSER DEFINITION
*&---------------------------------------------------------------------*
CLASS lcl_json_unit_parser DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_unit_parser.
    METHODS constructor IMPORTING i_json TYPE string.
  PRIVATE SECTION.
    DATA m_json TYPE string.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_XML_UNIT_PARSER DEFINITION
*&---------------------------------------------------------------------*
CLASS lcl_xml_unit_parser DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_unit_parser.
    METHODS constructor IMPORTING i_xml TYPE xstring.
  PRIVATE SECTION.
    DATA m_xml TYPE xstring.
    DATA mt_unit TYPE tt_unit.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_UNIT_HELPER DEFINITION
*&---------------------------------------------------------------------*
CLASS lcl_unit_helper DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS parse_data
      IMPORTING ir_data          TYPE REF TO data
      RETURNING VALUE(rt_result) TYPE tt_unit.
    CLASS-METHODS parse_json
      IMPORTING i_json           TYPE string
      RETURNING VALUE(rt_result) TYPE tt_unit.
    CLASS-METHODS parse_xml
      IMPORTING i_xml            TYPE xstring
      RETURNING VALUE(rt_result) TYPE tt_unit.
    CLASS-METHODS generate_flatdata
      IMPORTING it_unit        TYPE tt_unit
                i_compact      TYPE xfeld OPTIONAL
      EXPORTING et_flatdt      TYPE tt_flatdt
      RETURNING VALUE(rr_data) TYPE REF TO data.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_DATA_UNIT_PARSER IMPLEMENTATION
*&---------------------------------------------------------------------*
CLASS lcl_data_unit_parser IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& METHOD CONSTRUCTOR
*&---------------------------------------------------------------------*
  METHOD constructor.

    mr_data = ir_data.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& METHOD LIF_UNIT_PARSER~PARSE
*&---------------------------------------------------------------------*
  METHOD lif_unit_parser~parse.

    _parse( mr_data ).
    rt_result = mt_unit.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& METHOD _PARSE
*&---------------------------------------------------------------------*
  METHOD _parse.

    " 简单来说，就是获取数据的每个字段值，并记录对应路径

    " 数据解析相关参数
    DATA lo_typedescr TYPE REF TO cl_abap_typedescr.
    DATA lo_tabledescr TYPE REF TO cl_abap_tabledescr.
    DATA lo_structdescr TYPE REF TO cl_abap_structdescr.
    DATA lt_component TYPE cl_abap_structdescr=>component_table.
    DATA lr_component TYPE REF TO cl_abap_structdescr=>component.

    " 动态参数
    FIELD-SYMBOLS <fs_table> TYPE STANDARD TABLE.
    FIELD-SYMBOLS <fs_structure> TYPE any.
    FIELD-SYMBOLS <fs_field> TYPE any.
    " 动态引用参数
    FIELD-SYMBOLS <fs_ref> TYPE REF TO data.

    " 数据校验
    CHECK ir_data IS BOUND.
    IF io_typedescr IS BOUND.
      lo_typedescr = io_typedescr.
    ELSE.
      lo_typedescr = cl_abap_typedescr=>describe_by_data_ref( ir_data ).
    ENDIF.

    " 路径处理
    DATA l_pathname TYPE string.
    IF i_name IS INITIAL.
      l_pathname = i_path.
    ELSE.
      l_pathname = |{ i_path }.{ i_name }|.
    ENDIF.

    " 主要处理表、结构、数据元素、引用四种类型
    " 类和接口无需处理
    CASE lo_typedescr->kind.
      WHEN cl_abap_typedescr=>kind_table. " 表格类型
        ASSIGN ir_data->* TO <fs_table>.
        lo_tabledescr ?= lo_typedescr.
        lo_typedescr = lo_tabledescr->get_table_line_type( ). " 表行类型
        DATA l_tabix TYPE sy-tabix. " 所在行
        IF lo_typedescr->kind = cl_abap_typedescr=>kind_ref.
          LOOP AT <fs_table> ASSIGNING <fs_ref>.
            l_tabix = sy-tabix.
            _parse( " 引用类型直接迭代
                ir_data = <fs_ref>
                i_path = |{ l_pathname }[{ l_tabix }]| ).
          ENDLOOP.
        ELSE. " 非引用类型继续分析表行类型
          lo_structdescr ?= lo_typedescr.
          lt_component = lo_structdescr->get_components( ).
          LOOP AT <fs_table> ASSIGNING <fs_structure>.
            l_tabix = sy-tabix.
            LOOP AT lt_component REFERENCE INTO lr_component.
              ASSIGN COMPONENT lr_component->name OF STRUCTURE <fs_structure> TO <fs_field>.
              IF lr_component->type IS BOUND.
                _parse( " 如果行结构字段也是引用类型，继续迭代
                    ir_data = REF #( <fs_field> )
                    i_path = |{ l_pathname }[{ l_tabix }]|
                    i_name = lr_component->name
                    io_typedescr = lr_component->type ).
              ELSEIF <fs_field> IS ASSIGNED.
                INSERT VALUE #(
                  path = |{ l_pathname }[{ l_tabix }]|
                  key = lr_component->name
                  value = <fs_field>
                ) INTO TABLE mt_unit.
              ENDIF.
            ENDLOOP.
          ENDLOOP.
        ENDIF.

      WHEN cl_abap_typedescr=>kind_struct. " 结构类型
        ASSIGN ir_data->* TO <fs_structure>.
        lo_structdescr ?= lo_typedescr.
        lt_component = lo_structdescr->get_components( ).
        LOOP AT lt_component REFERENCE INTO lr_component.
          IF lr_component->type IS BOUND. " 非数据元素类型，继续迭代
            IF lr_component->type->kind = cl_abap_typedescr=>kind_ref.
              " 引用类型处理
              ASSIGN COMPONENT lr_component->name OF STRUCTURE <fs_structure> TO <fs_ref>.
              _parse(
                  ir_data = <fs_ref>
                  i_path = l_pathname
                  i_name = lr_component->name ).
            ELSE.
              " 非引用类型数据
              ASSIGN COMPONENT lr_component->name OF STRUCTURE <fs_structure> TO <fs_field>.
              _parse(
                  ir_data = REF #( <fs_field> )
                  i_path = l_pathname
                  i_name = lr_component->name ).
            ENDIF.
          ELSE.
            ASSIGN COMPONENT lr_component->name OF STRUCTURE <fs_structure> TO <fs_field>.
            INSERT VALUE #(
              path = l_pathname
              key = lr_component->name
              value = <fs_field>
            ) INTO TABLE mt_unit.
          ENDIF.
        ENDLOOP.

      WHEN cl_abap_typedescr=>kind_elem. " 数据元素类型
        ASSIGN ir_data->* TO <fs_field>.
        INSERT VALUE #(
          path = i_path
          key = i_name
          value = <fs_field>
        ) INTO TABLE mt_unit.

      WHEN cl_abap_typedescr=>kind_ref. " 引用类型，继续迭代
        ASSIGN ir_data->* TO <fs_ref>.
        _parse(
            ir_data = <fs_ref>
            i_path = i_path
            i_name = i_name ).
    ENDCASE.

  ENDMETHOD.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_JSON_UNIT_PARSER IMPLEMENTATION
*&---------------------------------------------------------------------*
CLASS lcl_json_unit_parser IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& METHOD CONSTRUCTOR
*&---------------------------------------------------------------------*
  METHOD constructor.

    m_json = i_json.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& METHOD LIF_UNIT_PARSER~PARSE
*&---------------------------------------------------------------------*
  METHOD lif_unit_parser~parse.

    DATA lo_parser TYPE REF TO lif_unit_parser.
    lo_parser ?= NEW lcl_data_unit_parser( /ui2/cl_json=>generate( m_json ) ).
    rt_result = lo_parser->parse( ).

  ENDMETHOD.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_XML_UNIT_PARSER IMPLEMENTATION
*&---------------------------------------------------------------------*
CLASS lcl_xml_unit_parser IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& METHOD CONSTRUCTOR
*&---------------------------------------------------------------------*
  METHOD constructor.

    m_xml = i_xml.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& METHOD LIF_UNIT_PARSER~PARSE
*&---------------------------------------------------------------------*
  METHOD lif_unit_parser~parse.

    DATA lt_path TYPE STANDARD TABLE OF string.
    DATA l_name TYPE string.

    DATA(lo_reader) = cl_sxml_string_reader=>create( m_xml ).
    DATA(lo_node) = lo_reader->read_next_node( ).
    WHILE lo_reader->node_type <> if_sxml_node=>co_nt_final.
      CASE lo_reader->node_type.
        WHEN if_sxml_node=>co_nt_element_open.
          IF l_name IS NOT INITIAL.
            INSERT l_name INTO TABLE lt_path.
          ENDIF.
          l_name = CAST if_sxml_open_element( lo_node )->qname-name.
        WHEN if_sxml_node=>co_nt_element_close.
          CLEAR l_name.
          IF lt_path IS NOT INITIAL.
            DATA(l_tabix) = lines( lt_path ).
            l_name = lt_path[ l_tabix ].
            DELETE lt_path INDEX l_tabix.
          ENDIF.
        WHEN if_sxml_node=>co_nt_value.
          DATA ls_unit TYPE ty_unit.
          CLEAR ls_unit.
          CONCATENATE LINES OF lt_path INTO ls_unit-path SEPARATED BY '.'.
          ls_unit-key = l_name.
          ls_unit-value = CAST if_sxml_value( lo_node )->get_value( ).
          INSERT ls_unit INTO TABLE mt_unit.
      ENDCASE.
      lo_node = lo_reader->read_next_node( ).
    ENDWHILE.

    rt_result = mt_unit.

  ENDMETHOD.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_UNIT_HELPER IMPLEMENTATION
*&---------------------------------------------------------------------*
CLASS lcl_unit_helper IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& METHOD PARSE_DATA
*&---------------------------------------------------------------------*
  METHOD parse_data.

    DATA lo_parser TYPE REF TO lif_unit_parser.
    lo_parser ?= NEW lcl_data_unit_parser( ir_data ).
    rt_result = lo_parser->parse( ).

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& METHOD PARSE_JSON
*&---------------------------------------------------------------------*
  METHOD parse_json.

    DATA lo_parser TYPE REF TO lif_unit_parser.
    lo_parser ?= NEW lcl_json_unit_parser( i_json ).
    rt_result = lo_parser->parse( ).

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& METHOD PARSE_XML
*&---------------------------------------------------------------------*
  METHOD parse_xml.

    DATA lo_parser TYPE REF TO lif_unit_parser.
    lo_parser ?= NEW lcl_xml_unit_parser( i_xml ).
    rt_result = lo_parser->parse( ).

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& METHOD GENERATE_FLATDATA
*& 将层级数据分析并生成平面数据
*&---------------------------------------------------------------------*
  METHOD generate_flatdata.

    CHECK it_unit IS NOT INITIAL.

    " 提取结构
    DATA lt_flatdt TYPE tt_flatdt.
    DATA ls_flatdt TYPE ty_flatdt.
    DATA lt_unitex TYPE tt_unitex.
    DATA ls_unitex TYPE ty_unitex.
    LOOP AT it_unit REFERENCE INTO DATA(lr_unit).
      CLEAR ls_flatdt.
      ls_flatdt-struct = lr_unit->path.
      ls_flatdt-field = lr_unit->key.
      REPLACE ALL OCCURRENCES OF REGEX '\[[0-9]*\]' IN ls_flatdt-struct WITH ''. " 去除表格索引
      INSERT ls_flatdt INTO TABLE lt_flatdt.
      CLEAR ls_unitex.
      ls_unitex-struct = ls_flatdt-struct.
      ls_unitex-path = lr_unit->path.
      ls_unitex-key = lr_unit->key.
      ls_unitex-value = lr_unit->value.
      INSERT ls_unitex INTO TABLE lt_unitex.
    ENDLOOP.
    SORT lt_flatdt BY struct field.
    DELETE ADJACENT DUPLICATES FROM lt_flatdt COMPARING struct field.

    " 计算每组结构最大字段数，并设定字段所在位置
    DATA l_count TYPE i.
    DATA l_count_max TYPE i.
    LOOP AT lt_flatdt REFERENCE INTO DATA(lr_flatdt).
      l_count = l_count + 1.
      lr_flatdt->position = l_count.
      AT END OF struct.
        IF l_count_max < l_count.
          l_count_max = l_count.
        ENDIF.
        CLEAR l_count.
      ENDAT.
    ENDLOOP.

    " 动态数据参数
    DATA lo_tabledescr TYPE REF TO cl_abap_tabledescr.
    DATA lo_structdescr TYPE REF TO cl_abap_structdescr.
    DATA lt_component TYPE cl_abap_structdescr=>component_table.
    DATA ls_component TYPE cl_abap_structdescr=>component.
    FIELD-SYMBOLS <fs_table> TYPE STANDARD TABLE.
    FIELD-SYMBOLS <fs_structure> TYPE any.
    FIELD-SYMBOLS <fs_field> TYPE any.
    FIELD-SYMBOLS <fs_fldk> TYPE any. " 用于染色

    CLEAR ls_component.
    ls_component-name = gs_fieldname-fdlk.
    ls_component-type = cl_abap_elemdescr=>get_string( ).
    INSERT ls_component INTO TABLE lt_component.
    CLEAR ls_component.
    ls_component-name = gs_fieldname-path.
    ls_component-type = cl_abap_elemdescr=>get_string( ).
    INSERT ls_component INTO TABLE lt_component.
    DATA l_index TYPE i.
    DO l_count_max TIMES.
      l_index = l_index + 1.
      CLEAR ls_component.
      ls_component-name = |{ gs_fieldname-field }{ l_index }|.
      ls_component-type = cl_abap_elemdescr=>get_string( ). " 都创建为STRING即可
      INSERT ls_component INTO TABLE lt_component.
    ENDDO.

    lo_structdescr = cl_abap_structdescr=>create( lt_component ).
    lo_tabledescr = cl_abap_tabledescr=>create( lo_structdescr ).
    CREATE DATA rr_data TYPE HANDLE lo_tabledescr.
    ASSIGN rr_data->* TO <fs_table>.

    " 紧凑表示与否
    IF i_compact = abap_true.
      " 紧凑表示按结构进行展示
      SORT lt_unitex BY struct path key.
    ELSE.
      " 非紧凑表示按数据顺序进行展示
      SORT lt_unitex BY path key.
    ENDIF.

    LOOP AT lt_unitex REFERENCE INTO DATA(lr_unitex).
      AT NEW struct. " 新的结构
        INSERT INITIAL LINE INTO TABLE <fs_table> ASSIGNING <fs_structure>.
        UNASSIGN <fs_fldk>.
        ASSIGN COMPONENT gs_fieldname-fdlk OF STRUCTURE <fs_structure> TO <fs_fldk>.
        IF <fs_fldk> IS ASSIGNED.
          <fs_fldk> = gs_fdlk-header.
        ENDIF.
        UNASSIGN <fs_field>.
        ASSIGN COMPONENT gs_fieldname-path OF STRUCTURE <fs_structure> TO <fs_field>.
        IF <fs_field> IS ASSIGNED.
          <fs_field> = lr_unitex->struct.
        ENDIF.
        READ TABLE lt_flatdt TRANSPORTING NO FIELDS WITH KEY struct = lr_unitex->struct BINARY SEARCH.
        IF sy-subrc = 0.
          LOOP AT lt_flatdt REFERENCE INTO lr_flatdt FROM sy-tabix.
            IF lr_flatdt->struct <> lr_unitex->struct.
              EXIT.
            ENDIF.
            UNASSIGN <fs_field>.
            ASSIGN COMPONENT |{ gs_fieldname-field }{ lr_flatdt->position }| OF STRUCTURE <fs_structure> TO <fs_field>.
            IF <fs_field> IS ASSIGNED.
              <fs_field> = lr_flatdt->field.
            ENDIF.
          ENDLOOP.
        ENDIF.
      ENDAT.

      AT NEW path. " 新的数据行
        INSERT INITIAL LINE INTO TABLE <fs_table> ASSIGNING <fs_structure>.
        UNASSIGN <fs_fldk>.
        ASSIGN COMPONENT gs_fieldname-fdlk OF STRUCTURE <fs_structure> TO <fs_fldk>.
        IF <fs_fldk> IS ASSIGNED.
          <fs_fldk> = gs_fdlk-data.
        ENDIF.
        ASSIGN COMPONENT gs_fieldname-path OF STRUCTURE <fs_structure> TO <fs_field>.
        IF <fs_field> IS ASSIGNED.
          <fs_field> = lr_unitex->path.
        ENDIF.
        CLEAR l_index.
      ENDAT.

      " 填充数据
      READ TABLE lt_flatdt REFERENCE INTO lr_flatdt WITH KEY
      struct = lr_unitex->struct
      field = lr_unitex->key
      BINARY SEARCH.
      IF sy-subrc = 0.
        UNASSIGN <fs_field>.
        ASSIGN COMPONENT |{ gs_fieldname-field }{ lr_flatdt->position }| OF STRUCTURE <fs_structure> TO <fs_field>.
        IF <fs_field> IS ASSIGNED.
          <fs_field> = lr_unitex->value.
        ENDIF.
      ENDIF.
    ENDLOOP.

    IF et_flatdt IS SUPPLIED.
      et_flatdt = lt_flatdt.
    ENDIF.

  ENDMETHOD.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LIF_ALV
*&---------------------------------------------------------------------*
INTERFACE lif_alv.
  METHODS pai.
  METHODS pbo.
  METHODS get_selected_uuid
    EXPORTING et_uuid     TYPE tt_uuid
              et_uuid_opt TYPE tt_uuid_opt. " 获取选择行的日志ID
ENDINTERFACE.
*&---------------------------------------------------------------------*
*& LCL_ALV_LOGH
*&---------------------------------------------------------------------*
CLASS lcl_alv_logh DEFINITION .
  PUBLIC SECTION.
    INTERFACES lif_alv.
    DATA ms_layout TYPE lvc_s_layo.
    DATA mt_fieldcat TYPE lvc_t_fcat.
    DATA mt_sort TYPE lvc_t_sort.
    METHODS set_layout.
    CLASS-METHODS set_fieldcat CHANGING ct_fieldcat TYPE lvc_t_fcat.
    METHODS set_sort.
    METHODS set_event.
    METHODS set_color.
    METHODS on_double_click FOR EVENT double_click OF cl_gui_alv_grid
      IMPORTING
        e_row
        e_column
        es_row_no.
    CLASS-METHODS display_rawdata
      IMPORTING i_uuid  TYPE ty_log_rawdata-uuid
                i_zitem TYPE ty_log_rawdata-zitem.
    CLASS-METHODS nav_se37
      IMPORTING i_funcname TYPE ty_log_head-func_name.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_ALV_UNIT
*&---------------------------------------------------------------------*
CLASS lcl_alv_logh IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& LIF_ALV~PBO
*&---------------------------------------------------------------------*
  METHOD lif_alv~pbo.

    IF go_container IS NOT BOUND.
      go_container = NEW cl_gui_custom_container( 'CON_9000' ).
    ENDIF.

    IF go_grid IS NOT BOUND.
      go_grid = NEW cl_gui_alv_grid( go_container ).
      set_layout( ).
      set_fieldcat( CHANGING ct_fieldcat = mt_fieldcat ).
      set_sort( ).
      set_event( ).
      set_color( ).
      DATA ls_variant TYPE disvariant.
      ls_variant = VALUE #( report = sy-repid handle = 1 ).
      CALL METHOD go_grid->set_table_for_first_display
        EXPORTING
          is_layout                     = ms_layout
          is_variant                    = ls_variant
          i_save                        = 'X'
        CHANGING
          it_outtab                     = gt_log
          it_fieldcatalog               = mt_fieldcat
          it_sort                       = mt_sort
        EXCEPTIONS
          invalid_parameter_combination = 1
          program_error                 = 2
          too_many_lines                = 3
          OTHERS                        = 4.
    ELSE.
      CALL METHOD go_grid->refresh_table_display
        EXPORTING
          is_stable      = CONV #( 'XX' )
          i_soft_refresh = abap_true
        EXCEPTIONS
          finished       = 1
          OTHERS         = 2.
    ENDIF.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_ALV~PAI
*&---------------------------------------------------------------------*
  METHOD lif_alv~pai.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_LAYOUT
*&---------------------------------------------------------------------*
  METHOD set_layout.

    CLEAR ms_layout.
    ms_layout-zebra = abap_true. " 斑马线
    ms_layout-cwidth_opt = abap_true. " 自动调整ALVL列宽
    ms_layout-sel_mode = 'A'. " 选择模式
    ms_layout-ctab_fname = 'T_SCOL'. " 单元格颜色设置
*    MS_LAYOUT-STYLEFNAME = 'T_STYL'. " 单元格控制

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_FIELDCAT
*&---------------------------------------------------------------------*
  METHOD set_fieldcat.

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

    _init_fieldcat 'UUID     ' '日志ID' '' ''.
*    _INIT_FIELDCAT 'ZITEM    ' '序号' '' ''.
    _init_fieldcat 'LOG_KIND ' '日志分类' '' ''.
    _init_fieldcat 'INTF_ID  ' '接口标识' '' ''.
    _init_fieldcat 'FUNC_NAME' '函数名' '' ''.
    _init_fieldcat 'FUNC_TEXT' '函数描述' '' ''.
*    _INIT_FIELDCAT 'ZTEXT    ' '附加信息' '' ''. " 该项目没有
    _init_fieldcat 'IO_FLAG  ' '接口方向' '' ''.
    _init_fieldcat 'ZSENDER  ' '发送方' '' ''.
    _init_fieldcat 'ZRECEIVER' '接收方' '' ''.
    _init_fieldcat 'ZDATE    ' '日期' '' ''.
    _init_fieldcat 'ZTIME    ' '时间' '' ''.
    _init_fieldcat 'ZUSER    ' '用户' '' ''.
    _init_fieldcat 'MTYPE    ' '状态' '' ''.
*    _INIT_FIELDCAT 'MSG      ' '消息文本' '' ''. " 该项目没有
    _init_fieldcat 'ZCONUT   ' '条目统计' '' ''.
    _init_fieldcat 'ZRAW_ICON' '原始数据' '' ''.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_SORT
*&---------------------------------------------------------------------*
  METHOD set_sort.

    DATA ls_sort TYPE lvc_s_sort.
    DATA l_spos TYPE lvc_s_sort-spos.

    CLEAR ls_sort.
    l_spos = l_spos + 1.
    ls_sort-spos = l_spos.
    ls_sort-fieldname = 'ZDATE'.
    ls_sort-down = abap_true.
    INSERT ls_sort INTO TABLE mt_sort.

    CLEAR ls_sort.
    l_spos = l_spos + 1.
    ls_sort-spos = l_spos.
    ls_sort-fieldname = 'ZTIME'.
    ls_sort-down = abap_true.
    INSERT ls_sort INTO TABLE mt_sort.

    CLEAR ls_sort.
    l_spos = l_spos + 1.
    ls_sort-spos = l_spos.
    ls_sort-fieldname = 'UUID'.
    ls_sort-up = abap_true.
    INSERT ls_sort INTO TABLE mt_sort.

    CLEAR ls_sort.
    l_spos = l_spos + 1.
    ls_sort-spos = l_spos.
    ls_sort-fieldname = 'IO_FLAG'.
    ls_sort-up = abap_true.
    INSERT ls_sort INTO TABLE mt_sort.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_EVENT
*&---------------------------------------------------------------------*
  METHOD set_event.

    SET HANDLER on_double_click FOR go_grid.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_COLOR
*&---------------------------------------------------------------------*
  METHOD set_color.
    DATA ls_scol TYPE lvc_s_scol.

    LOOP AT gt_log REFERENCE INTO DATA(lr_log).
      CLEAR lr_log->t_scol.
      IF lr_log->mtype = 'S'.
        lr_log->t_scol = VALUE #( BASE lr_log->t_scol
          color = gs_color-green
          ( fname = 'MTYPE'  )
          ( fname = 'MSG' ) ).
      ELSE.
        lr_log->t_scol = VALUE #( BASE lr_log->t_scol
          color = gs_color-red
          ( fname = 'MTYPE'  )
          ( fname = 'MSG' ) ).
      ENDIF.
    ENDLOOP.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& ON_DOUBLE_CLICK
*&---------------------------------------------------------------------*
  METHOD on_double_click.

    READ TABLE gt_log REFERENCE INTO DATA(lr_log) INDEX e_row-index.
    CHECK sy-subrc = 0.

    CASE e_column.
      WHEN 'UUID'.
        DATA lt_uuid_opt LIKE RANGE OF gs_selection-uuid.
        lt_uuid_opt = VALUE #( sign = 'I' option = 'EQ' ( low = lr_log->uuid ) ).
        SUBMIT (sy-repid)
        WITH s_uuid IN lt_uuid_opt " 接口ID
        WITH s_date IN s_date " 日期会默认当天，手工传值
        WITH s_time IN s_time " 日期会默认当天，手工传值
        WITH p_logh = ''
        WITH p_unit = ''
        WITH p_flat = 'X'
        AND RETURN.
      WHEN 'ZRAW_ICON'.
        display_rawdata( i_uuid = lr_log->uuid
                         i_zitem = lr_log->zitem ).
      WHEN 'FUNC_NAME'.
        nav_se37( lr_log->func_name ).
    ENDCASE.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& DISPLAY_RAWDATA
*&---------------------------------------------------------------------*
  METHOD display_rawdata.

    DATA l_html TYPE xstring.

    READ TABLE gt_log_rawdata REFERENCE INTO DATA(lr_log_rawdata) WITH KEY
    uuid = i_uuid
    zitem = i_zitem
    BINARY SEARCH.
    IF sy-subrc = 0.
      CASE lr_log_rawdata->zformat.
        WHEN 'JSON'.
          " cl_demo_output=>display_json( lr_log_rawdata->zraw ).
          CALL TRANSFORMATION sjson2html SOURCE XML lr_log_rawdata->zraw RESULT XML l_html.
          cl_abap_browser=>show_html( html_string = cl_abap_codepage=>convert_from( l_html ) ).
        WHEN 'XML'.
*          cl_demo_output=>display_xml( lr_log_rawdata->zrawx ).
          cl_abap_browser=>show_xml( xml_xstring = lr_log_rawdata->zrawx ).
        WHEN OTHERS.
          cl_demo_output=>display( lr_log_rawdata->zraw ).
      ENDCASE.
    ENDIF.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& NAV_SE37
*&---------------------------------------------------------------------*
  METHOD nav_se37.

    DATA ls_tfdir TYPE tfdir.
    " 获取函数对应程序
    SELECT SINGLE pname include
      INTO CORRESPONDING FIELDS OF ls_tfdir
      FROM tfdir
      WHERE funcname = i_funcname.
    " 设置函数全局信息
    DATA ls_rs38l TYPE rs38l.
    CALL FUNCTION 'FUNCTION_INCLUDE_SPLIT'
      EXPORTING
        program                      = ls_tfdir-pname
      IMPORTING
        group                        = ls_rs38l-area
        namespace                    = ls_rs38l-namespace
      EXCEPTIONS
        include_not_exists           = 1
        group_not_exists             = 2
        no_selections                = 3
        no_function_include          = 4
        no_function_pool             = 5
        delimiter_wrong_position     = 6
        no_customer_function_group   = 7
        no_customer_function_include = 8
        reserved_name_customer       = 9
        namespace_too_long           = 10
        area_length_error            = 11
        OTHERS                       = 12.
    CONCATENATE 'L' ls_rs38l-area 'U' ls_tfdir-include INTO ls_tfdir-pname.
    CALL FUNCTION 'EDITOR_PROGRAM'
      EXPORTING
        display = 'X'
        program = ls_tfdir-pname
      EXCEPTIONS
        OTHERS  = 1.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_ALV~GET_SELECTED_UUID
*&---------------------------------------------------------------------*
  METHOD lif_alv~get_selected_uuid.

    " 获取ALV选取行
    DATA lt_rows TYPE lvc_t_row.
    CALL METHOD go_grid->get_selected_rows
      IMPORTING
        et_index_rows = lt_rows.

    LOOP AT lt_rows INTO DATA(ls_row).
      READ TABLE gt_log REFERENCE INTO DATA(lr_log) INDEX ls_row-index.
      CHECK sy-subrc = 0.
      IF et_uuid IS SUPPLIED.
        APPEND lr_log->uuid TO et_uuid.
      ENDIF.
      IF et_uuid_opt IS SUPPLIED.
        INSERT VALUE #( sign = 'I' option = 'EQ' low = lr_log->uuid ) INTO TABLE et_uuid_opt.
      ENDIF.
    ENDLOOP.

    SORT et_uuid BY table_line.
    DELETE ADJACENT DUPLICATES FROM et_uuid COMPARING table_line.
    DELETE et_uuid WHERE table_line IS INITIAL.

    SORT et_uuid_opt BY low.
    DELETE ADJACENT DUPLICATES FROM et_uuid_opt COMPARING low.
    DELETE et_uuid_opt WHERE low IS INITIAL.

  ENDMETHOD.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_ALV_UNIT
*&---------------------------------------------------------------------*
CLASS lcl_alv_unit DEFINITION .
  PUBLIC SECTION.
    INTERFACES lif_alv.
    TYPES:
      BEGIN OF ty_data.
        INCLUDE TYPE ty_log_head.
        INCLUDE TYPE ty_unit.
    TYPES:
      END OF ty_data.
    DATA mt_data TYPE STANDARD TABLE OF ty_data WITH EMPTY KEY.
    DATA ms_layout TYPE lvc_s_layo.
    DATA mt_fieldcat TYPE STANDARD TABLE OF lvc_s_fcat.
    METHODS constructor.
    METHODS process_data.
    METHODS set_layout.
    METHODS set_fieldcat.
    METHODS set_event.
    METHODS set_color.
    METHODS on_double_click FOR EVENT double_click OF cl_gui_alv_grid
      IMPORTING
        e_row
        e_column
        es_row_no.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_ALV_UNIT
*&---------------------------------------------------------------------*
CLASS lcl_alv_unit IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& CONSTRUCTOR
*&---------------------------------------------------------------------*
  METHOD constructor.
    process_data( ).
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& PROCESS_DATA
*&---------------------------------------------------------------------*
  METHOD process_data.

    DATA ls_data TYPE ty_data.
    DATA(lo_progress) = NEW lcl_progress( ).
    lo_progress->m_name = '转化单元数据'.
    lo_progress->start( lines( gt_log ) ).
    LOOP AT gt_log REFERENCE INTO DATA(lr_log).
      lo_progress->next( ).
      CLEAR ls_data.
      ls_data = CORRESPONDING #( lr_log->* ).
      LOOP AT lr_log->t_unit REFERENCE INTO DATA(lr_unit).
        DATA(ls_data_tmp) = ls_data.
        ls_data_tmp-path = lr_unit->path.
        ls_data_tmp-key = lr_unit->key.
        ls_data_tmp-value = lr_unit->value.
        INSERT ls_data_tmp INTO TABLE mt_data.
      ENDLOOP.
    ENDLOOP.
    lo_progress->finish( ).

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_ALV~PBO
*&---------------------------------------------------------------------*
  METHOD lif_alv~pbo.

    IF go_container IS NOT BOUND.
      go_container = NEW cl_gui_custom_container( 'CON_9000' ).
    ENDIF.

    IF go_grid IS NOT BOUND.
      go_grid = NEW cl_gui_alv_grid( go_container ).
      set_layout( ).
      set_fieldcat( ).
      set_event( ).
      set_color( ).
      DATA ls_variant TYPE disvariant.
      ls_variant = VALUE #( report = sy-repid handle = 2 ).
      CALL METHOD go_grid->set_table_for_first_display
        EXPORTING
          is_layout                     = ms_layout
          is_variant                    = ls_variant
          i_save                        = 'X'
        CHANGING
          it_outtab                     = mt_data
          it_fieldcatalog               = mt_fieldcat
        EXCEPTIONS
          invalid_parameter_combination = 1
          program_error                 = 2
          too_many_lines                = 3
          OTHERS                        = 4.
    ELSE.
      CALL METHOD go_grid->refresh_table_display
        EXPORTING
          is_stable      = CONV #( 'XX' )
          i_soft_refresh = abap_true
        EXCEPTIONS
          finished       = 1
          OTHERS         = 2.
    ENDIF.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_ALV~PAI
*&---------------------------------------------------------------------*
  METHOD lif_alv~pai.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_LAYOUT
*&---------------------------------------------------------------------*
  METHOD set_layout.

    CLEAR ms_layout.
    ms_layout-zebra = abap_true. " 斑马线
    ms_layout-cwidth_opt = abap_true. " 自动调整ALVL列宽
    ms_layout-sel_mode = 'A'. " 选择模式
*    MS_LAYOUT-CTAB_FNAME = 'T_SCOL'. " 单元格颜色设置
*    MS_LAYOUT-STYLEFNAME = 'T_STYL'. " 单元格控制

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_FIELDCAT
*&---------------------------------------------------------------------*
  METHOD set_fieldcat.

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
      INSERT ls_fieldcat INTO TABLE mt_fieldcat.
    END-OF-DEFINITION.

    lcl_alv_logh=>set_fieldcat( CHANGING ct_fieldcat = mt_fieldcat ).
    _init_fieldcat 'PATH' '路径' '' ''.
    _init_fieldcat 'KEY' '字段名' '' ''.
    _init_fieldcat 'VALUE' '字段值' '' ''.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_EVENT
*&---------------------------------------------------------------------*
  METHOD set_event.

    SET HANDLER on_double_click FOR go_grid.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_COLOR
*&---------------------------------------------------------------------*
  METHOD set_color.
    DATA ls_scol TYPE lvc_s_scol.

    LOOP AT mt_data REFERENCE INTO DATA(lr_data).
      CLEAR lr_data->t_scol.
      IF lr_data->mtype = 'S'.
        lr_data->t_scol = VALUE #( BASE lr_data->t_scol
          color = gs_color-green
          ( fname = 'MTYPE'  )
          ( fname = 'MSG' ) ).
      ELSE.
        lr_data->t_scol = VALUE #( BASE lr_data->t_scol
          color = gs_color-red
          ( fname = 'MTYPE'  )
          ( fname = 'MSG' ) ).
      ENDIF.
    ENDLOOP.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& ON_DOUBLE_CLICK
*&---------------------------------------------------------------------*
  METHOD on_double_click.

    READ TABLE mt_data REFERENCE INTO DATA(lr_data) INDEX e_row-index.
    CHECK sy-subrc = 0.
    CASE e_column.
      WHEN 'ZRAW_ICON'.
        lcl_alv_logh=>display_rawdata(
            i_uuid = lr_data->uuid
            i_zitem = lr_data->zitem ).
      WHEN 'FUNC_NAME'.
        lcl_alv_logh=>nav_se37( lr_data->func_name ).
    ENDCASE.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_ALV~GET_SELECTED_UUID
*&---------------------------------------------------------------------*
  METHOD lif_alv~get_selected_uuid.

    " 获取ALV选取行
    DATA lt_rows TYPE lvc_t_row.
    CALL METHOD go_grid->get_selected_rows
      IMPORTING
        et_index_rows = lt_rows.

    LOOP AT lt_rows INTO DATA(ls_row).
      READ TABLE mt_data REFERENCE INTO DATA(lr_unit) INDEX ls_row-index.
      CHECK sy-subrc = 0.
      IF et_uuid IS SUPPLIED.
        APPEND lr_unit->uuid TO et_uuid.
      ENDIF.
      IF et_uuid_opt IS SUPPLIED.
        INSERT VALUE #( sign = 'I' option = 'EQ' low = lr_unit->uuid ) INTO TABLE et_uuid_opt.
      ENDIF.
    ENDLOOP.

    SORT et_uuid BY table_line.
    DELETE ADJACENT DUPLICATES FROM et_uuid COMPARING table_line.
    DELETE et_uuid WHERE table_line IS INITIAL.

    SORT et_uuid_opt BY low.
    DELETE ADJACENT DUPLICATES FROM et_uuid_opt COMPARING low.
    DELETE et_uuid_opt WHERE low IS INITIAL.

  ENDMETHOD.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_ALV_FLAT
*&---------------------------------------------------------------------*
CLASS lcl_alv_flat DEFINITION .
  PUBLIC SECTION.
    INTERFACES lif_alv.
    DATA mt_component_flat TYPE cl_abap_structdescr=>component_table.
    DATA mr_data TYPE REF TO data.
    DATA ms_layout TYPE lvc_s_layo.
    DATA mt_fieldcat TYPE STANDARD TABLE OF lvc_s_fcat.
    METHODS constructor.
    METHODS process_data.
    METHODS set_layout.
    METHODS set_fieldcat.
    METHODS set_event.
    METHODS set_color.
    METHODS on_double_click FOR EVENT double_click OF cl_gui_alv_grid
      IMPORTING
        e_row
        e_column
        es_row_no.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_ALV_FLAT
*&---------------------------------------------------------------------*
CLASS lcl_alv_flat IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& CONSTRUCTOR
*&---------------------------------------------------------------------*
  METHOD constructor.
    process_data( ).
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& PROCESS_DATA
*&---------------------------------------------------------------------*
  METHOD process_data.

    " 计算最大字段数量
    DATA l_count_max TYPE i.
    LOOP AT gt_log REFERENCE INTO DATA(lr_log).
      LOOP AT lr_log->t_flatdt REFERENCE INTO DATA(lr_flatdt).
        IF l_count_max < lr_flatdt->position.
          l_count_max = lr_flatdt->position.
        ENDIF.
      ENDLOOP.
    ENDLOOP.

    " 抬头部分固定
    DATA lo_tabledescr TYPE REF TO cl_abap_tabledescr.
    DATA lo_structdescr TYPE REF TO cl_abap_structdescr.
    DATA lt_component TYPE cl_abap_structdescr=>component_table.
    DATA ls_component TYPE cl_abap_structdescr=>component.
    lo_structdescr ?= cl_abap_typedescr=>describe_by_data( VALUE ty_log_head( ) ).
    lt_component = lo_structdescr->get_components( ).

    " 扁平部分
    CLEAR ls_component.
    ls_component-name = gs_fieldname-fdlk.
    ls_component-type = cl_abap_elemdescr=>get_string( ).
    INSERT ls_component INTO TABLE mt_component_flat.
    CLEAR ls_component.
    ls_component-name = gs_fieldname-path.
    ls_component-type = cl_abap_elemdescr=>get_string( ).
    INSERT ls_component INTO TABLE mt_component_flat.
    DATA l_index TYPE i.
    DO l_count_max TIMES.
      l_index = l_index + 1.
      CLEAR ls_component.
      ls_component-name = |{ gs_fieldname-field }{ l_index }|.
      ls_component-type = cl_abap_elemdescr=>get_string( ). " 都创建为STRING即可
      INSERT ls_component INTO TABLE mt_component_flat.
    ENDDO.
    INSERT LINES OF mt_component_flat INTO TABLE lt_component.

    " 创建报表展示结构
    lo_structdescr = cl_abap_structdescr=>create( lt_component ).
    lo_tabledescr = cl_abap_tabledescr=>create( lo_structdescr ).
    CREATE DATA mr_data TYPE HANDLE lo_tabledescr.

    FIELD-SYMBOLS <fs_table> TYPE STANDARD TABLE.
    FIELD-SYMBOLS <fs_structure> TYPE any.
    FIELD-SYMBOLS <fs_field> TYPE any.
    ASSIGN mr_data->* TO <fs_table>.

    DATA(lo_progress) = NEW lcl_progress( ).
    lo_progress->m_name = '转化扁平结构'.
    lo_progress->start( lines( gt_log ) ).

    LOOP AT gt_log REFERENCE INTO lr_log.
      lo_progress->next( ).

      IF <fs_table> IS NOT INITIAL.
        DO p_ctl5 TIMES. " 间隔行，不然太紧凑不好看数据
          INSERT INITIAL LINE INTO TABLE <fs_table>.
        ENDDO.
      ENDIF.

      IF lr_log->r_flatdata IS NOT BOUND.
        INSERT INITIAL LINE INTO TABLE <fs_table> ASSIGNING <fs_structure>.
        <fs_structure> = CORRESPONDING #( lr_log->* ). " 日志抬头部分
        CONTINUE.
      ENDIF.

      FIELD-SYMBOLS <fs_flatdata_table> TYPE STANDARD TABLE.
      FIELD-SYMBOLS <fs_flatdata_structure> TYPE any.
      FIELD-SYMBOLS <fs_flatdata_field> TYPE any.
      UNASSIGN <fs_flatdata_table>.
      UNASSIGN <fs_flatdata_structure>.
      ASSIGN lr_log->r_flatdata->* TO <fs_flatdata_table>.

      LOOP AT <fs_flatdata_table> ASSIGNING <fs_flatdata_structure>.
        IF p_ctl2 <> abap_true. " 展示抬头
          ASSIGN COMPONENT gs_fieldname-fdlk OF STRUCTURE <fs_flatdata_structure> TO FIELD-SYMBOL(<fs_fdlk>).
          IF <fs_fdlk> IS ASSIGNED.
            CHECK <fs_fdlk> <> gs_fdlk-header.
          ENDIF.
        ENDIF.

        INSERT INITIAL LINE INTO TABLE <fs_table> ASSIGNING <fs_structure>.
        <fs_structure> = CORRESPONDING #( lr_log->* ). " 日志抬头部分
        LOOP AT mt_component_flat INTO ls_component.
          UNASSIGN <fs_flatdata_field>.
          UNASSIGN <fs_field>.
          ASSIGN COMPONENT ls_component-name OF STRUCTURE <fs_flatdata_structure> TO <fs_flatdata_field>.
          ASSIGN COMPONENT ls_component-name OF STRUCTURE <fs_structure> TO <fs_field>.
          IF <fs_flatdata_field> IS ASSIGNED AND <fs_field> IS ASSIGNED.
            <fs_field> = <fs_flatdata_field>.
          ENDIF.
        ENDLOOP.
      ENDLOOP.

    ENDLOOP.
    lo_progress->finish( ).

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_ALV~PBO
*&---------------------------------------------------------------------*
  METHOD lif_alv~pbo.

    IF go_container IS NOT BOUND.
      go_container = NEW cl_gui_custom_container( 'CON_9000' ).
    ENDIF.

    IF go_grid IS NOT BOUND.
      go_grid = NEW cl_gui_alv_grid( go_container ).
      set_layout( ).
      set_fieldcat( ).
      set_event( ).
      set_color( ).

      FIELD-SYMBOLS <fs_table> TYPE STANDARD TABLE.
      ASSIGN mr_data->* TO <fs_table>.

      DATA ls_variant TYPE disvariant.
      ls_variant = VALUE #( report = sy-repid handle = 3 ).
      CALL METHOD go_grid->set_table_for_first_display
        EXPORTING
          is_layout                     = ms_layout
          is_variant                    = ls_variant
          i_save                        = 'X'
        CHANGING
          it_outtab                     = <fs_table>
          it_fieldcatalog               = mt_fieldcat
        EXCEPTIONS
          invalid_parameter_combination = 1
          program_error                 = 2
          too_many_lines                = 3
          OTHERS                        = 4.
    ELSE.
      CALL METHOD go_grid->refresh_table_display
        EXPORTING
          is_stable      = CONV #( 'XX' )
          i_soft_refresh = abap_true
        EXCEPTIONS
          finished       = 1
          OTHERS         = 2.
    ENDIF.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_ALV~PAI
*&---------------------------------------------------------------------*
  METHOD lif_alv~pai.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_LAYOUT
*&---------------------------------------------------------------------*
  METHOD set_layout.

    CLEAR ms_layout.
*    MS_LAYOUT-ZEBRA = ABAP_TRUE. " 斑马线
    ms_layout-cwidth_opt = p_ctl4. " ABAP_TRUE. " 自动调整ALVL列宽
    ms_layout-sel_mode = 'A'. " 选择模式
    ms_layout-info_fname = 'RCOL'. " 单元格颜色设置
    ms_layout-ctab_fname = 'T_SCOL'. " 单元格颜色设置
*    MS_LAYOUT-STYLEFNAME = 'T_STYL'. " 单元格控制

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_FIELDCAT
*&---------------------------------------------------------------------*
  METHOD set_fieldcat.

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
      INSERT ls_fieldcat INTO TABLE mt_fieldcat.
    END-OF-DEFINITION.

    lcl_alv_logh=>set_fieldcat( CHANGING ct_fieldcat = mt_fieldcat ).
    _init_fieldcat gs_fieldname-path '路径' '' ''.
    LOOP AT mt_component_flat INTO DATA(ls_component_flat).
      IF ls_component_flat-name CS gs_fieldname-field.
        _init_fieldcat ls_component_flat-name '-' '' ''.
      ENDIF.
    ENDLOOP.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_EVENT
*&---------------------------------------------------------------------*
  METHOD set_event.

    SET HANDLER on_double_click FOR go_grid.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& SET_COLOR
*&---------------------------------------------------------------------*
  METHOD set_color.

    DATA ls_scol TYPE lvc_s_scol.
    DATA ls_log_head TYPE ty_log_head.
    FIELD-SYMBOLS <fs_table> TYPE STANDARD TABLE.
    FIELD-SYMBOLS <fs_structure> TYPE any.
    FIELD-SYMBOLS <fs_field> TYPE any.
    FIELD-SYMBOLS <fs_t_scol> TYPE lvc_t_scol.

    ASSIGN mr_data->* TO <fs_table>.

    LOOP AT <fs_table> ASSIGNING <fs_structure>.
      IF <fs_structure> IS INITIAL.
        ASSIGN COMPONENT 'RCOL' OF STRUCTURE <fs_structure> TO FIELD-SYMBOL(<fs_rcol>).
        IF <fs_rcol> IS ASSIGNED.
          <fs_rcol> = 'C300'.
        ENDIF.
        CONTINUE.
      ENDIF.

      ASSIGN COMPONENT 'T_SCOL' OF STRUCTURE <fs_structure> TO <fs_t_scol>.
      CLEAR <fs_t_scol>.

      CLEAR ls_log_head.
      ls_log_head = CORRESPONDING #( <fs_structure> ).
      IF ls_log_head-mtype = 'S'.
        <fs_t_scol> = VALUE #( BASE <fs_t_scol>
          color = gs_color-green
          ( fname = 'MTYPE'  )
          ( fname = 'MSG' ) ).
      ELSE.
        <fs_t_scol> = VALUE #( BASE <fs_t_scol>
          color = gs_color-red
          ( fname = 'MTYPE'  )
          ( fname = 'MSG' ) ).
      ENDIF.

      CHECK p_ctl3 = abap_true. " 单元格着色
      UNASSIGN <fs_field>.
      ASSIGN COMPONENT gs_fieldname-fdlk OF STRUCTURE <fs_structure> TO <fs_field>.
      CHECK <fs_field> IS ASSIGNED.

      DATA ls_color LIKE gs_color-red.
      CLEAR ls_color.
      CASE <fs_field>.
        WHEN gs_fdlk-header.
          ls_color = gs_color-dept_blue.
        WHEN gs_fdlk-data.
*          LS_COLOR = GS_COLOR-BLUE.
        WHEN OTHERS.
          ls_color = gs_color-yellow.
      ENDCASE.
      LOOP AT mt_component_flat INTO DATA(ls_component).
        CLEAR ls_scol.
        ls_scol-fname = ls_component-name.
        ls_scol-color = ls_color.
        INSERT ls_scol INTO TABLE <fs_t_scol>.
      ENDLOOP.

    ENDLOOP.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& ON_DOUBLE_CLICK
*&---------------------------------------------------------------------*
  METHOD on_double_click.

    FIELD-SYMBOLS <fs_table> TYPE STANDARD TABLE.
    FIELD-SYMBOLS <fs_structure> TYPE any.
    ASSIGN mr_data->* TO <fs_table>.

    READ TABLE <fs_table> ASSIGNING <fs_structure> INDEX e_row-index.
    CHECK sy-subrc = 0.

    DATA ls_log_head TYPE ty_log_head.
    ls_log_head = CORRESPONDING #( <fs_structure> ).

    CASE e_column.
      WHEN 'ZRAW_ICON'.
        lcl_alv_logh=>display_rawdata(
            i_uuid = ls_log_head-uuid
            i_zitem = ls_log_head-zitem ).
      WHEN 'FUNC_NAME'.
        lcl_alv_logh=>nav_se37( ls_log_head-func_name ).
    ENDCASE.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_ALV~GET_SELECTED_UUID
*&---------------------------------------------------------------------*
  METHOD lif_alv~get_selected_uuid.

    FIELD-SYMBOLS <fs_table> TYPE STANDARD TABLE.
    FIELD-SYMBOLS <fs_structure> TYPE any.
    ASSIGN mr_data->* TO <fs_table>.

    " 获取ALV选取行
    DATA lt_rows TYPE lvc_t_row.
    CALL METHOD go_grid->get_selected_rows
      IMPORTING
        et_index_rows = lt_rows.

    LOOP AT lt_rows INTO DATA(ls_row).
      READ TABLE <fs_table> ASSIGNING <fs_structure> INDEX ls_row-index.
      CHECK sy-subrc = 0.
      ASSIGN COMPONENT 'UUID' OF STRUCTURE <fs_structure> TO FIELD-SYMBOL(<fs_uuid>).
      IF et_uuid IS SUPPLIED.
        APPEND <fs_uuid> TO et_uuid.
      ENDIF.
      IF et_uuid_opt IS SUPPLIED.
        INSERT VALUE #( sign = 'I' option = 'EQ' low = <fs_uuid> ) INTO TABLE et_uuid_opt.
      ENDIF.
    ENDLOOP.

    SORT et_uuid BY table_line.
    DELETE ADJACENT DUPLICATES FROM et_uuid COMPARING table_line.
    DELETE et_uuid WHERE table_line IS INITIAL.

    SORT et_uuid_opt BY low.
    DELETE ADJACENT DUPLICATES FROM et_uuid_opt COMPARING low.
    DELETE et_uuid_opt WHERE low IS INITIAL.

  ENDMETHOD.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LIF_LOG
*&---------------------------------------------------------------------*
INTERFACE lif_log.
  METHODS check_active
    RETURNING VALUE(r_result) TYPE xfeld.
  METHODS get_log_kind
    RETURNING VALUE(r_log_kind) TYPE ty_log_head-log_kind.
  METHODS get_data.
  METHODS redo
    IMPORTING it_uuid TYPE tt_uuid.
ENDINTERFACE.
*&---------------------------------------------------------------------*
*& LCL_LOG_PO
*&---------------------------------------------------------------------*
CLASS lcl_log_po DEFINITION .
  PUBLIC SECTION.
    INTERFACES lif_log.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_LOG_PO
*&---------------------------------------------------------------------*
CLASS lcl_log_po IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& lif_log~get_log_kind
*&---------------------------------------------------------------------*
  METHOD lif_log~get_log_kind.
    r_log_kind = 'PO'.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_LOG~GET_DATA
*&---------------------------------------------------------------------*
  METHOD lif_log~get_data.

    DATA ls_log TYPE ty_log.
    DATA ls_log_rawdata TYPE ty_log_rawdata.

    DATA:
      ls_clustkey TYPE sxmsclustkey,
      ls_clur     TYPE sxmsclur,
      lt_res      TYPE sxmsrest,
      lt_xres     TYPE sxmsxrest,
      lt_ns       TYPE sxmsnst.

    DATA l_from TYPE sxmspmast-sendtimest.
    DATA l_to TYPE sxmspmast-sendtimest.

    IF s_time[] IS NOT INITIAL.
      CONVERT DATE s_date[ 1 ]-low TIME s_time[ 1 ]-low INTO TIME STAMP l_from TIME ZONE sy-zonlo.
      CONVERT DATE s_date[ 1 ]-high TIME s_time[ 1 ]-high INTO TIME STAMP l_to TIME ZONE sy-zonlo.
    ELSE.
      CONVERT DATE s_date[ 1 ]-low TIME '000000' INTO TIME STAMP l_from TIME ZONE sy-zonlo.
      CONVERT DATE s_date[ 1 ]-high TIME '235959' INTO TIME STAMP l_to TIME ZONE sy-zonlo.
    ENDIF.

    " SXMSPEMAS，框架信息，发送SI，接收SI，命名空间，系统等
    " SXMSPMAST，主要信息，用户，开始结束时间等
    " SXMSCLUR，消息报文
    SELECT
      a~msgguid,
      a~pid,
      b~ob_system,
      b~ob_name,
      b~ib_system,
      b~ib_name,
      a~adminuser,
      a~sendtimest,
      a~msgtype
      FROM sxmspmast AS a
      JOIN sxmspemas AS b ON a~msgguid = b~msgguid
                         AND a~pid = b~pid
      WHERE a~msgguid IN @s_uuid
        AND a~sendtimest BETWEEN @l_from AND @l_to
        AND ( b~ob_name IN @s_siname OR b~ib_name IN @s_siname )
        AND a~adminuser IN @s_user
        AND a~msgtype IN @s_mtype
      INTO TABLE @DATA(lt_pilog).

    LOOP AT lt_pilog INTO DATA(ls_pilog).
      " 读取PO报文
      CLEAR ls_clustkey.
      CLEAR ls_clur    .
      CLEAR lt_res     .
      CLEAR lt_xres    .
      CLEAR lt_ns      .
      ls_clustkey-msgguid = ls_pilog-msgguid.
      ls_clustkey-pid = ls_pilog-pid.
      IMPORT
        lt_res TO lt_res
        lt_xres TO lt_xres
        lt_ns TO lt_ns
        FROM DATABASE sxmsclur(is) TO ls_clur ID ls_clustkey.

      CLEAR ls_log.
      ls_log-uuid = ls_pilog-msgguid.
      " 接口ID
      IF ls_pilog-ob_name IS NOT INITIAL.
        ls_log-intf_id = ls_pilog-ob_name.
      ELSE.
        ls_log-intf_id = ls_pilog-ib_name.
      ENDIF.
      ls_log-io_flag = ls_pilog-pid. " 接口方向
      ls_log-zsender = ls_pilog-ob_system. " 发送方
      ls_log-zreceiver = ls_pilog-ib_system. " 接受方
      CONVERT TIME STAMP ls_pilog-sendtimest TIME ZONE sy-zonlo INTO DATE ls_log-zdate TIME ls_log-ztime.
      ls_log-zuser = ls_pilog-adminuser.
      ls_log-mtype = ls_pilog-msgtype.
      INSERT ls_log INTO TABLE gt_log.

      READ TABLE lt_xres REFERENCE INTO DATA(lr_xres) INDEX 1.
      IF sy-subrc = 0 AND lr_xres->rescontent IS NOT INITIAL.
        CLEAR ls_log_rawdata.
        ls_log_rawdata-uuid = ls_pilog-msgguid.
        ls_log_rawdata-zformat = 'XML'.
        ls_log_rawdata-zrawx = lr_xres->rescontent. " 原始数据
        INSERT ls_log_rawdata INTO TABLE gt_log_rawdata.
      ENDIF.
    ENDLOOP.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_LOG~REDO
*&---------------------------------------------------------------------*
  METHOD lif_log~redo.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& lif_log~check_active
*&---------------------------------------------------------------------*
  METHOD lif_log~check_active.
    r_result = p_po.
  ENDMETHOD.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_LOG_CUSTOM
*&---------------------------------------------------------------------*
CLASS lcl_log_custom DEFINITION .
  PUBLIC SECTION.
    INTERFACES lif_log.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_LOG_CUSTOM
*&---------------------------------------------------------------------*
CLASS lcl_log_custom IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& lif_log~get_log_kind
*&---------------------------------------------------------------------*
  METHOD lif_log~get_log_kind.
    r_log_kind = 'CUSTOM'.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_LOG~GET_DATA
*&---------------------------------------------------------------------*
  METHOD lif_log~get_data.

    " DATA ls_log TYPE ty_log.
    " DATA ls_log_rawdata TYPE ty_log_rawdata.
    " DATA l_zitem TYPE ty_log-zitem.

    " SELECT
    "   ztintf~sysid,
    "   ztintf~funcname,
    "   tftit~stext
    "   FROM ztintf
    "   JOIN tftit ON ztintf~funcname = tftit~funcname
    "             AND tftit~spras = '1'
    "   INTO TABLE @DATA(lt_ztintf).
    " SORT lt_ztintf BY sysid.

    " SELECT * FROM ztlog
    " WHERE zguid IN @s_uuid
    "   AND intfid IN @s_intfid
    "   AND zsender IN @s_snd
    "   AND zreceiver IN @s_rcv
    "   AND datum IN @s_date
    "   AND uzeit IN @s_time
    "   AND zstatus IN @s_mtype
    "   AND funcname IN @s_func
    " INTO TABLE @DATA(lt_ztlog).

    " SORT lt_ztlog BY zguid.

    " LOOP AT lt_ztlog INTO DATA(ls_ztlog).
    "   AT NEW zguid.
    "     CLEAR l_zitem.
    "   ENDAT.
    "   l_zitem = l_zitem + 1.

    "   CLEAR ls_log.
    "   ls_log-uuid = ls_ztlog-zguid.
    "   ls_log-zitem = l_zitem.
    "   ls_log-intf_id = ls_ztlog-intfid. " 接口ID
    "   READ TABLE lt_ztintf REFERENCE INTO DATA(lr_ztintf)
    "   WITH KEY sysid = ls_ztlog-intfid BINARY SEARCH.
    "   IF sy-subrc = 0.
    "     ls_log-func_name = lr_ztintf->funcname.
    "     ls_log-func_text = lr_ztintf->stext.
    "   ENDIF.
    "   ls_log-io_flag = ls_ztlog-zzio. " 接口方向
    "   ls_log-zsender = ls_ztlog-zsender. " 发送方
    "   ls_log-zreceiver = ls_ztlog-zreceiver. " 接受方
    "   ls_log-zdate = ls_ztlog-datum.
    "   ls_log-ztime = ls_ztlog-uzeit.
    "   ls_log-zuser = ls_ztlog-uname.
    "   ls_log-mtype = ls_ztlog-zstatus.
    "   ls_log-zconut = ls_ztlog-zcount. " 条目统计
    "   INSERT ls_log INTO TABLE gt_log.

    "   IF ls_ztlog-zjson IS NOT INITIAL.
    "     CLEAR ls_log_rawdata.
    "     ls_log_rawdata-uuid = ls_ztlog-zguid.
    "     ls_log_rawdata-zitem = l_zitem.
    "     ls_log_rawdata-zformat = 'JSON'.
    "     ls_log_rawdata-zraw = ls_ztlog-zjson. " 原始数据
    "     INSERT ls_log_rawdata INTO TABLE gt_log_rawdata.
    "   ENDIF.
    " ENDLOOP.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_LOG~REDO
*&---------------------------------------------------------------------*
  METHOD lif_log~redo.

    " DATA l_fsyid TYPE string.
    " DATA l_fname TYPE string.
    " DATA l_sdata TYPE string.
    " DATA l_infud TYPE string.
    " DATA l_ftname TYPE string.
    " DATA(lo_proxy) = NEW zcl_intf_proxy( ).

    " LOOP AT it_uuid INTO DATA(l_uuid).
    "   READ TABLE gt_log INTO DATA(ls_log) WITH KEY
    "   uuid = l_uuid
    "   io_flag = '2'.
    "   IF ls_log-mtype = 'S'.
    "     lcl_progress=>step( |{ l_uuid }不需要重处理| ).
    "     CONTINUE.
    "   ELSE.
    "     READ TABLE gt_log INTO ls_log WITH KEY
    "     uuid = l_uuid
    "     io_flag = '1'.
    "     IF sy-subrc = 0.
    "       READ TABLE gt_log_rawdata INTO DATA(ls_log_rawdata) WITH KEY
    "       uuid = ls_log-uuid
    "       zitem = ls_log-zitem
    "       BINARY SEARCH.
    "       IF sy-subrc = 0.
    "         l_fsyid = ls_log-zsender. " 外部系统
    "         l_fname = ls_log-intf_id. " 接口ID
    "         l_sdata = ls_log_rawdata-zraw. " 请求报文
    "         l_infud = ls_log-uuid. " 报文ID
    "         l_ftname = ls_log-func_name. " 对应函数名
    "         CASE ls_log-zsender.
    "           WHEN 'SAP'.
    "             CALL METHOD lo_proxy->sap_data_to_out
    "               EXPORTING
    "                 iv_fname  = l_fname
    "                 iv_sdata  = l_sdata
    "                 iv_infud  = l_infud
    "                 iv_ftname = l_ftname.
    "           WHEN OTHERS.
    "             CALL METHOD lo_proxy->out_data_to_sap
    "               EXPORTING
    "                 iv_fsyid = l_fsyid
    "                 iv_fname = l_fname
    "                 iv_sdata = l_sdata
    "                 iv_infud = l_infud.
    "         ENDCASE.
    "         lcl_progress=>step( |{ l_uuid }已提交重处理| ).
    "       ENDIF.
    "     ENDIF.
    "   ENDIF.
    " ENDLOOP.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& lif_log~check_active
*&---------------------------------------------------------------------*
  METHOD lif_log~check_active.
    r_result = p_custom.
  ENDMETHOD.
ENDCLASS.

*&---------------------------------------------------------------------*
*& FRM_INIT
*&---------------------------------------------------------------------*
FORM frm_init.

  GET PARAMETER ID 'LIB' FIELD s_func-low. " 更新参数相关

  b900 = '自定义选择条件'.
  %_p_custom_%_app_%-text = '查询自定义日志'.
  %_s_intfid_%_app_%-text = '接口编号'.
  b100 = '通用选择条件'.
  %_s_uuid_%_app_%-text = 'UUID'.
  %_s_func_%_app_%-text = '函数名'.
  %_s_snd_%_app_%-text = '发送方'.
  %_s_rcv_%_app_%-text = '接收方'.
  %_s_date_%_app_%-text = '处理日期'.
  %_s_time_%_app_%-text = '处理时间'.
  %_s_user_%_app_%-text = '处理人'.
  %_s_mtype_%_app_%-text = '状态'.
  b101 = '扩展选择条件'.
  %_s_field_%_app_%-text = '字段名'.
  %_s_value_%_app_%-text = '字段值'.
  b102 = 'PO选择条件'.
  %_p_po_%_app_%-text = '查询PO'.
  %_s_siname_%_app_%-text = '接口名称'.
  b200 = '报表样式'.
  %_p_logh_%_app_%-text = '日志抬头数据展示'.
  %_p_unit_%_app_%-text = '单元数据展示'.
  %_p_flat_%_app_%-text = '扁平结构展示'.
  b201 = '其他选项'.
  %_p_ctl1_%_app_%-text = '紧凑展示'.
  %_p_ctl2_%_app_%-text = '展示结构抬头'.
  %_p_ctl3_%_app_%-text = '单元格着色'.
  %_p_ctl4_%_app_%-text = '列宽自适应'.
  %_p_ctl5_%_app_%-text = '日志记录相隔空行'.

  gs_color-blue   = VALUE #( col = 4 ).
  gs_color-yellow = VALUE #( col = 3 ).
  gs_color-green  = VALUE #( col = 5 ).
  gs_color-red    = VALUE #( col = 6 ).
  gs_color-dept_blue   = VALUE #( col = 4 int = 1 ).
  gs_color-dept_yellow = VALUE #( col = 3 int = 1 ).
  gs_color-dept_green  = VALUE #( col = 5 int = 1 ).
  gs_color-dept_red    = VALUE #( col = 6 int = 1 ).

  PERFORM frm_find_log_impl. " 查找并创建日志实例

ENDFORM.
*&---------------------------------------------------------------------*
*& FRM_FIND_LOG_IMPL
*&---------------------------------------------------------------------*
FORM frm_find_log_impl.

  DATA lt_classname TYPE STANDARD TABLE OF seoclsname.

  DATA lo_classdescr TYPE REF TO cl_abap_classdescr.
  DATA lo_log TYPE REF TO lif_log.
  DATA(lo_scan) = NEW cl_ci_scan( cl_ci_source_include=>create( p_name = sy-repid ) ).
  LOOP AT lo_scan->tokens INTO DATA(ls_token) WHERE str = 'CLASS'.
    READ TABLE lo_scan->tokens INTO ls_token INDEX sy-tabix + 1.
    INSERT CONV #( ls_token-str ) INTO TABLE lt_classname.
  ENDLOOP.
  SORT lt_classname BY table_line.
  DELETE ADJACENT DUPLICATES FROM lt_classname COMPARING table_line.

  LOOP AT lt_classname INTO DATA(l_classname).
    lo_classdescr ?= cl_abap_classdescr=>describe_by_name( l_classname ).
    READ TABLE lo_classdescr->interfaces TRANSPORTING NO FIELDS WITH KEY name = 'LIF_LOG'.
    IF sy-subrc = 0.
      TRY.
          CREATE OBJECT lo_log TYPE (lo_classdescr->absolute_name).
          INSERT lo_log INTO TABLE gt_log_impl.
        CATCH cx_root.
      ENDTRY.
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& FRM_MAIN
*&---------------------------------------------------------------------*
FORM frm_main.

  " 为了方便读取时间+日期范围，稍微调整下日期格式
  LOOP AT s_date REFERENCE INTO DATA(lr_date_opt).
    IF lr_date_opt->high IS INITIAL.
      lr_date_opt->option = 'BT'.
      lr_date_opt->high = lr_date_opt->low.
    ENDIF.
  ENDLOOP.
  LOOP AT s_time REFERENCE INTO DATA(lr_time_opt).
    IF lr_time_opt->high IS INITIAL.
      lr_time_opt->option = 'BT'.
      lr_time_opt->high = lr_time_opt->low.
    ENDIF.
  ENDLOOP.

  lcl_progress=>step( '查询日志数据' ).
  PERFORM frm_get_data.

  lcl_progress=>step( '日志数据处理' ).
  PERFORM frm_process_data.

  PERFORM frm_display. " ALV展示

ENDFORM.
*&---------------------------------------------------------------------*
*& FRM_GET_DATA
*&---------------------------------------------------------------------*
FORM frm_get_data.

  DATA lt_log TYPE tt_log.
  LOOP AT gt_log_impl INTO DATA(lo_log).
    CHECK lo_log->check_active( ) = abap_true.
    CLEAR gt_log.
    lo_log->get_data( ). " 取数
    LOOP AT gt_log REFERENCE INTO DATA(lr_log).
      lr_log->log_kind = lo_log->get_log_kind( ).
      lr_log->zraw_icon = icon_detail.
    ENDLOOP.
    INSERT LINES OF gt_log INTO TABLE lt_log.
  ENDLOOP.
  gt_log = lt_log.

ENDFORM.
*&---------------------------------------------------------------------*
*& FRM_PROCESS_DATA
*&---------------------------------------------------------------------*
FORM frm_process_data.

  " 日期时间倒序
  SORT gt_log BY zdate DESCENDING
                 ztime DESCENDING
                 uuid
                 zitem DESCENDING.

  SORT gt_log_rawdata BY uuid zitem. " 用于弹窗展示原始数据

  " 不需要展示加工数据的话，没必要继续执行浪费时间
  IF p_logh = abap_true AND s_value[] IS INITIAL.
    RETURN.
  ENDIF.

*  " 模糊查询
*  LOOP AT s_value[] REFERENCE INTO DATA(lr_value_opt).
*    IF lr_value_opt->option = 'EQ'.
*      lr_value_opt->option = 'CP'.
*      lr_value_opt->low = |*{ lr_value_opt->low }*|.
*    ENDIF.
*  ENDLOOP.

  DATA(lo_progress) = NEW lcl_progress( ).
  lo_progress->m_name = '接口数据处理'.
  lo_progress->start( lines( gt_log ) ).

  LOOP AT gt_log REFERENCE INTO DATA(lr_log).
    lo_progress->next( ). " 进度展示

    " 转化为数据单元
    READ TABLE gt_log_rawdata REFERENCE INTO DATA(lr_log_rawdata) WITH KEY
    uuid = lr_log->uuid
    zitem = lr_log->zitem
    BINARY SEARCH.
    IF sy-subrc = 0.
      CASE lr_log_rawdata->zformat.
        WHEN 'JSON'.
          lr_log->t_unit = lcl_unit_helper=>parse_json( lr_log_rawdata->zraw ).
        WHEN 'XML'.
          lr_log->t_unit = lcl_unit_helper=>parse_xml( lr_log_rawdata->zrawx ).
      ENDCASE.
    ENDIF.
    CHECK lr_log->t_unit IS NOT INITIAL.

    " 扩展查询
    IF s_value[] IS NOT INITIAL.
      IF s_field[] IS NOT INITIAL.
        LOOP AT lr_log->t_unit TRANSPORTING NO FIELDS WHERE key IN s_field[] AND value IN s_value[].
          EXIT.
        ENDLOOP.
      ELSE.
        LOOP AT lr_log->t_unit TRANSPORTING NO FIELDS WHERE value IN s_value[].
          EXIT.
        ENDLOOP.
      ENDIF.
      " 过滤不符合条件的数据
      IF sy-subrc <> 0.
        DELETE gt_log.
        CONTINUE.
      ENDIF.
    ENDIF.

    CALL METHOD lcl_unit_helper=>generate_flatdata
      EXPORTING
        it_unit   = lr_log->t_unit
        i_compact = p_ctl1
      IMPORTING
        et_flatdt = lr_log->t_flatdt
      RECEIVING
        rr_data   = lr_log->r_flatdata.
  ENDLOOP.
  lo_progress->finish( ).

ENDFORM.
*&---------------------------------------------------------------------*
*& FRM_DISPLAY
*&---------------------------------------------------------------------*
FORM frm_display.

  CASE 'X'.
    WHEN p_logh. " 日志抬头数据展示
      go_alv ?= NEW lcl_alv_logh( ).
    WHEN p_unit. " 单元数据展示
      go_alv ?= NEW lcl_alv_unit( ).
    WHEN p_flat." 扁平结构展示
      go_alv ?= NEW lcl_alv_flat( ).
    WHEN OTHERS.
      MESSAGE '无效的展示方式' TYPE 'S' DISPLAY LIKE 'E'.
      RETURN.
  ENDCASE.
  CALL SCREEN '9000'.

ENDFORM.
*&---------------------------------------------------------------------*
*& FRM_REDO
*&---------------------------------------------------------------------*
FORM frm_redo.

  go_alv->get_selected_uuid( IMPORTING et_uuid = DATA(lt_uuid) ).
  CHECK lt_uuid IS NOT INITIAL.

  LOOP AT gt_log_impl INTO DATA(lo_log).
    CHECK lo_log->check_active( ) = abap_true.
    DATA(l_log_kind) = lo_log->get_log_kind( ).
    DATA lt_uuid_tmp TYPE tt_uuid.
    CLEAR lt_uuid_tmp.
    LOOP AT gt_log REFERENCE INTO DATA(lr_log) WHERE log_kind = l_log_kind.
      READ TABLE lt_uuid INTO DATA(l_uuid) WITH KEY table_line = lr_log->uuid BINARY SEARCH.
      IF sy-subrc = 0.
        INSERT l_uuid INTO TABLE lt_uuid_tmp.
      ENDIF.
    ENDLOOP.
    IF lt_uuid_tmp IS NOT INITIAL.
      lo_log->redo( lt_uuid_tmp ).
    ENDIF.
  ENDLOOP.

ENDFORM.
*&---------------------------------------------------------------------*
*& FRM_F4_INTFID
*&---------------------------------------------------------------------*
FORM frm_f4_intfid.

  " SELECT
  "   ztintf~sysnm,
  "   ztintf~sysid,
  "   ztintf~funcname,
  "   tftit~stext
  "   FROM ztintf
  "   JOIN tftit ON spras = '1'
  "             AND ztintf~funcname = tftit~funcname
  "   INTO TABLE @DATA(lt_ztintf).
  " 
  " DATA l_dynprofield TYPE dynfnam.
  " GET CURSOR FIELD l_dynprofield.
  " 
  " CALL FUNCTION 'F4IF_INT_TABLE_VALUE_REQUEST'
  "   EXPORTING
  "     retfield        = 'SYSID'
  "     value_org       = 'S'
  "     dynprofield     = l_dynprofield
  "     dynpprog        = sy-repid
  "     dynpnr          = sy-dynnr
  "   TABLES
  "     value_tab       = lt_ztintf
  "   EXCEPTIONS
  "     parameter_error = 1
  "     no_values_found = 2
  "     OTHERS          = 3.
  " IF sy-subrc <> 0.
  "   MESSAGE ID sy-msgid TYPE sy-msgty NUMBER sy-msgno
  "           WITH sy-msgv1 sy-msgv2 sy-msgv3 sy-msgv4.
  " ENDIF.

ENDFORM.

*&---------------------------------------------------------------------*
*& 初始化
*&---------------------------------------------------------------------*
INITIALIZATION.
  PERFORM frm_init.

**&---------------------------------------------------------------------*
**& 自定义日志表接口ID搜索帮助
**&---------------------------------------------------------------------*
*AT SELECTION-SCREEN ON VALUE-REQUEST FOR s_intfid-low.
*  PERFORM frm_f4_intfid.
*
*AT SELECTION-SCREEN ON VALUE-REQUEST FOR s_intfid-high.
*  PERFORM frm_f4_intfid.

*&---------------------------------------------------------------------*
*& START-OF-SELECTION
*&---------------------------------------------------------------------*
START-OF-SELECTION.
  PERFORM frm_main.

*&---------------------------------------------------------------------*
*& MODULE STATUS_9000 OUTPUT
*&---------------------------------------------------------------------*
MODULE status_9000 OUTPUT.
  go_alv->pbo( ).
  SET PF-STATUS 'STATUS'.
ENDMODULE.
*&---------------------------------------------------------------------*
*& MODULE USER_COMMAND_9000  INPUT
*&---------------------------------------------------------------------*
MODULE user_command_9000 INPUT.
  CASE sy-ucomm.
    WHEN 'REDO'. " 错误重处理
      PERFORM frm_redo.
    WHEN '&F03' OR '&F15' OR '&F12'.
      LEAVE TO SCREEN 0.
    WHEN OTHERS.
      go_alv->pai( ).
  ENDCASE.
ENDMODULE.

```

</details>

<details>
  <summary>LIF_LOG实例参考代码</summary>

```ABAP


*&---------------------------------------------------------------------*
*& LCL_LOG_CUSTOM
*&---------------------------------------------------------------------*
CLASS lcl_log_custom DEFINITION .
  PUBLIC SECTION.
    INTERFACES lif_log.
ENDCLASS.
*&---------------------------------------------------------------------*
*& LCL_LOG_CUSTOM
*&---------------------------------------------------------------------*
CLASS lcl_log_custom IMPLEMENTATION.
*&---------------------------------------------------------------------*
*& lif_log~get_log_kind
*&---------------------------------------------------------------------*
  METHOD lif_log~get_log_kind.
    r_log_kind = 'CUSTOM'.
  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_LOG~GET_DATA
*&---------------------------------------------------------------------*
  METHOD lif_log~get_data.

    DATA ls_log TYPE ty_log.
    DATA ls_log_rawdata TYPE ty_log_rawdata.
    DATA l_zitem TYPE ty_log-zitem.

    SELECT
      ztintf~sysid,
      ztintf~funcname,
      tftit~stext
      FROM ztintf
      JOIN tftit ON ztintf~funcname = tftit~funcname
                AND tftit~spras = '1'
      INTO TABLE @DATA(lt_ztintf).
    SORT lt_ztintf BY sysid.

    SELECT * FROM ztlog
    WHERE zguid IN @s_uuid
      AND intfid IN @s_intfid
      AND zsender IN @s_snd
      AND zreceiver IN @s_rcv
      AND datum IN @s_date
      AND uzeit IN @s_time
      AND zstatus IN @s_mtype
      AND funcname IN @s_func
    INTO TABLE @DATA(lt_ztlog).

    SORT lt_ztlog BY zguid.

    LOOP AT lt_ztlog INTO DATA(ls_ztlog).
      AT NEW zguid.
        CLEAR l_zitem.
      ENDAT.
      l_zitem = l_zitem + 1.

      CLEAR ls_log.
      ls_log-uuid = ls_ztlog-zguid.
      ls_log-zitem = l_zitem.
      ls_log-intf_id = ls_ztlog-intfid. " 接口ID
      READ TABLE lt_ztintf REFERENCE INTO DATA(lr_ztintf)
      WITH KEY sysid = ls_ztlog-intfid BINARY SEARCH.
      IF sy-subrc = 0.
        ls_log-func_name = lr_ztintf->funcname.
        ls_log-func_text = lr_ztintf->stext.
      ENDIF.
      ls_log-io_flag = ls_ztlog-zzio. " 接口方向
      ls_log-zsender = ls_ztlog-zsender. " 发送方
      ls_log-zreceiver = ls_ztlog-zreceiver. " 接受方
      ls_log-zdate = ls_ztlog-datum.
      ls_log-ztime = ls_ztlog-uzeit.
      ls_log-zuser = ls_ztlog-uname.
      ls_log-mtype = ls_ztlog-zstatus.
      ls_log-zconut = ls_ztlog-zcount. " 条目统计
      INSERT ls_log INTO TABLE gt_log.

      IF ls_ztlog-zjson IS NOT INITIAL.
        CLEAR ls_log_rawdata.
        ls_log_rawdata-uuid = ls_ztlog-zguid.
        ls_log_rawdata-zitem = l_zitem.
        ls_log_rawdata-zformat = 'JSON'.
        ls_log_rawdata-zraw = ls_ztlog-zjson. " 原始数据
        INSERT ls_log_rawdata INTO TABLE gt_log_rawdata.
      ENDIF.
    ENDLOOP.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& LIF_LOG~REDO
*&---------------------------------------------------------------------*
  METHOD lif_log~redo.

    DATA l_fsyid TYPE string.
    DATA l_fname TYPE string.
    DATA l_sdata TYPE string.
    DATA l_infud TYPE string.
    DATA l_ftname TYPE string.
    DATA(lo_proxy) = NEW zcl_intf_proxy( ).

    LOOP AT it_uuid INTO DATA(l_uuid).
      READ TABLE gt_log INTO DATA(ls_log) WITH KEY
      uuid = l_uuid
      io_flag = '2'.
      IF ls_log-mtype = 'S'.
        lcl_progress=>step( |{ l_uuid }不需要重处理| ).
        CONTINUE.
      ELSE.
        READ TABLE gt_log INTO ls_log WITH KEY
        uuid = l_uuid
        io_flag = '1'.
        IF sy-subrc = 0.
          READ TABLE gt_log_rawdata INTO DATA(ls_log_rawdata) WITH KEY
          uuid = ls_log-uuid
          zitem = ls_log-zitem
          BINARY SEARCH.
          IF sy-subrc = 0.
            l_fsyid = ls_log-zsender. " 外部系统
            l_fname = ls_log-intf_id. " 接口ID
            l_sdata = ls_log_rawdata-zraw. " 请求报文
            l_infud = ls_log-uuid. " 报文ID
            l_ftname = ls_log-func_name. " 对应函数名
            CASE ls_log-zsender.
              WHEN 'SAP'.
                CALL METHOD lo_proxy->sap_data_to_out
                  EXPORTING
                    iv_fname  = l_fname
                    iv_sdata  = l_sdata
                    iv_infud  = l_infud
                    iv_ftname = l_ftname.
              WHEN OTHERS.
                CALL METHOD lo_proxy->out_data_to_sap
                  EXPORTING
                    iv_fsyid = l_fsyid
                    iv_fname = l_fname
                    iv_sdata = l_sdata
                    iv_infud = l_infud.
            ENDCASE.
            lcl_progress=>step( |{ l_uuid }已提交重处理| ).
          ENDIF.
        ENDIF.
      ENDIF.
    ENDLOOP.

  ENDMETHOD.
*&---------------------------------------------------------------------*
*& lif_log~check_active
*&---------------------------------------------------------------------*
  METHOD lif_log~check_active.
    r_result = p_custom.
  ENDMETHOD.
ENDCLASS.

```

</details>
