# 工艺路线

<details>
  <summary>示例代码</summary>

```ABAP

*----------------------------------------------------------------------*
***INCLUDE LZGRP_PP_021D01.
*----------------------------------------------------------------------*
*&---------------------------------------------------------------------*
*&       Class lcl_bapi_proxy
*&---------------------------------------------------------------------*
*        Text
*----------------------------------------------------------------------*
CLASS lcl_routing_create_proxy DEFINITION.
  PUBLIC SECTION.
    METHODS:
      "! 初始化参数
      init,
      "! 按接口参数类型填充数据
      "! @parameter head |
      "! @parameter items |
      fill_data_by_type1
        IMPORTING
          head  TYPE zspp_0029_head
          items TYPE zttpp_0029_item,
      "! 测试运行
      "! @parameter result |
      testrun
        RETURNING
          VALUE(result) TYPE xflag,
      "! 创建工艺路线
      execute,
      "! 获取检查/创建/其他处理消息
      "! @parameter type |
      "! @parameter message |
      get_message
        EXPORTING
          type    TYPE bapi_mtype
          message TYPE bapi_msg,
      "! 使用BAPI_ROUTING_EXISTENCE_CHECK检查工艺路线是否存在
      "! @parameter group |
      "! @parameter groupcounter |
      "! @parameter validfrom |
      "! @parameter validtodate |
      "! @parameter result |
      check_exists
        IMPORTING
          group         TYPE bapi1012_tsk_c-task_list_group
          groupcounter  TYPE bapi1012_tsk_c-group_counter
          validfrom     TYPE bapi1012_tsk_c-valid_from
          validtodate   TYPE bapi1012_tsk_c-valid_to_date OPTIONAL
        RETURNING
          VALUE(result) TYPE xflag,
      "! 根据工厂/物料/产线检查工艺路线是否存在
      "! @parameter werks |
      "! @parameter matnr |
      "! @parameter plnnr_alt |
      "! @parameter result |
      check_exist_by_mapl
        IMPORTING
          werks         TYPE werks_d
          matnr         TYPE matnr
          plnnr_alt     TYPE cp_plnnr_a
        RETURNING
          VALUE(result) TYPE xflag,
      "! 重复物料与工厂的工艺路线下最新的计数
      "! @parameter matnr |
      "! @parameter werks |
      "! @parameter countor |
      next_counter
        IMPORTING
          werks   TYPE werks_d
          matnr   TYPE matnr
        EXPORTING
          group   TYPE bapi1012_tsk_c-task_list_group
          counter TYPE bapi1012_tsk_c-group_counter.

  PRIVATE SECTION.
    DATA ms_group TYPE bapi1012_tsk_c.
    DATA mt_task TYPE STANDARD TABLE OF bapi1012_tsk_c WITH EMPTY KEY.
    DATA mt_mat_task TYPE STANDARD TABLE OF bapi1012_mtk_c WITH EMPTY KEY.
    DATA mt_operation TYPE STANDARD TABLE OF bapi1012_opr_c WITH EMPTY KEY.
    DATA mt_return TYPE STANDARD TABLE OF bapiret2 WITH EMPTY KEY.
ENDCLASS.               "lcl_bapi_proxy
*&---------------------------------------------------------------------*
*&       Class lcl_bapi_proxy
*&---------------------------------------------------------------------*
CLASS lcl_routing_create_proxy IMPLEMENTATION.
  " 测试运行
  METHOD testrun.
    DATA l_testrun TYPE bapiflag.
    l_testrun-bapiflag = 'X'.
    CALL FUNCTION 'BAPI_ROUTING_CREATE'
      EXPORTING
        testrun                = l_testrun
      IMPORTING
        group                  = ms_group-task_list_group
        groupcounter           = ms_group-group_counter
      TABLES
        task                   = mt_task
        materialtaskallocation = mt_mat_task
        operation              = mt_operation
        return                 = mt_return.
    READ TABLE mt_return TRANSPORTING NO FIELDS WITH KEY type = 'E'.
    IF sy-subrc = 0.
      CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
      RETURN.
    ENDIF.
    result = 'X'.
  ENDMETHOD.

  " 运行
  METHOD execute.
    " 创建工艺路线
    CLEAR mt_return.
    CALL FUNCTION 'BAPI_ROUTING_CREATE'
      IMPORTING
        group                  = ms_group-task_list_group
        groupcounter           = ms_group-group_counter
      TABLES
        task                   = mt_task
        materialtaskallocation = mt_mat_task
        operation              = mt_operation
        return                 = mt_return.
    READ TABLE mt_return TRANSPORTING NO FIELDS WITH KEY type = 'E'.
    IF sy-subrc = 0.
      CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
      RETURN.
    ENDIF.
    CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
      EXPORTING
        wait = 'X'.
  ENDMETHOD.

  " 获取消息
  METHOD get_message.
    READ TABLE mt_return TRANSPORTING NO FIELDS WITH KEY type = 'E'.
    IF sy-subrc = 0.
      type = 'E'.
      LOOP AT mt_return REFERENCE INTO DATA(lr_return).
        MESSAGE ID lr_return->id TYPE lr_return->type
        NUMBER lr_return->number
        WITH lr_return->message_v1 lr_return->message_v2
             lr_return->message_v3 lr_return->message_v4
        INTO DATA(l_message).
        message = |{ message }{ l_message };|.
      ENDLOOP.
    ELSE.
      type = 'S'.
      message = |工艺路线被保存于组{ ms_group-task_list_group }|.
    ENDIF.
  ENDMETHOD.

  " 根据接口参数填充数据
  METHOD fill_data_by_type1.
    " 抬头
    APPEND INITIAL LINE TO mt_task REFERENCE INTO DATA(lr_task).
    lr_task->plant = head-werks. " 工厂
    " 对于重复物料和工厂，不是新建一条工艺路线，而是在原有组下新增计数
    next_counter( EXPORTING matnr = head-matnr
                            werks = head-werks
                  IMPORTING group = lr_task->task_list_group
                            counter = lr_task->group_counter ).
    lr_task->old_number_of_task_list = head-plnnr_alt. " 产线
    lr_task->description = head-ktext. " 工艺路线描述
    lr_task->task_list_usage = '1'. " 用途，默认值
    lr_task->task_list_status = '4'. " 状态，默认值
    lr_task->task_measure_unit = 'PCS'.
    lr_task->task_measure_unit_iso = 'PCS'.
    lr_task->lot_size_from = head-losvn. " 批量下限
    lr_task->lot_size_to = head-losbs. " 批量上限
    lr_task->valid_from = head-datuv. " 有效起始日期
    lr_task->valid_to_date = '99991231'. " 有效结束日期
    " 物料指派
    APPEND INITIAL LINE TO mt_mat_task REFERENCE INTO DATA(lr_mat_task).
    lr_mat_task->material = head-matnr. " 成品编码
    lr_mat_task->plant = head-werks. " 工厂
    lr_mat_task->valid_from = head-datuv. " 有效起始日期
    lr_mat_task->valid_to_date = '99991231'. " 有效结束日期

    " 工序
    LOOP AT items REFERENCE INTO DATA(lr_item).
      APPEND INITIAL LINE TO mt_operation REFERENCE INTO DATA(lr_operation).
      lr_operation->activity = lr_item->vornr. " 工序编号
      lr_operation->description = lr_item->ltxa1. " 工序短文本
      lr_operation->standard_text_key = lr_item->vlsch. " 标准文本码
      lr_operation->plant = head-werks.
      lr_operation->work_cntr = lr_item->arbpl. " 工作中心
      lr_operation->control_key = lr_item->steus. " 控制码
      lr_operation->base_quantity = lr_item->bmsch. " 工序基本数量
      lr_operation->valid_from = head-datuv. " 有效起始日期
      lr_operation->valid_to_date = '99991231'. " 有效结束日期
      lr_operation->denominator = '1'.
      lr_operation->nominator = '1'.

      " 计量单位
      lr_operation->operation_measure_unit = lr_item->meinh.
      CALL FUNCTION 'CONVERSION_EXIT_CUNIT_INPUT'
        EXPORTING
          input  = lr_operation->operation_measure_unit
        IMPORTING
          output = lr_operation->operation_measure_unit.

      " 计量单位
      lr_operation->operation_measure_unit_iso = lr_item->meinh.
      CALL FUNCTION 'CONVERSION_EXIT_CUNIT_INPUT'
        EXPORTING
          input  = lr_operation->operation_measure_unit_iso
        IMPORTING
          output = lr_operation->operation_measure_unit_iso.

      lr_operation->no_of_employee = lr_item->anzma. " 雇员数量
      lr_operation->valid_from = head-datuv. " 有效起始日期
      lr_operation->valid_to_date = '99991231'. " 有效结束日期

      " 重复代码
      DEFINE _set_acti.
        lr_operation->std_unit_0&1 = lr_item->vge0&1.
        lr_operation->std_unit_0&1_iso = lr_item->vge0&1.
        lr_operation->std_value_0&1 = lr_item->vgw0&1.
      END-OF-DEFINITION.
      _set_acti 1. " 折旧摊销
      _set_acti 2. " 直接人工
      _set_acti 3. " 间接人工
      _set_acti 4. " 动力费
      _set_acti 5. " 生产耗材
      _set_acti 6. " 维修保养
    ENDLOOP.
  ENDMETHOD.

  " 初始化参数
  METHOD init.
    CLEAR ms_group.
    CLEAR mt_task.
    CLEAR mt_mat_task.
    CLEAR mt_operation.
    CLEAR mt_return.
  ENDMETHOD.

  " 检查工序是否已经存在
  METHOD check_exists.
    DATA lt_return TYPE STANDARD TABLE OF bapiret2.
    CALL FUNCTION 'BAPI_ROUTING_EXISTENCE_CHECK'
      EXPORTING
        group        = group
        groupcounter = groupcounter
        validfrom    = validfrom
        validtodate  = validtodate
      TABLES
        return       = lt_return.
    READ TABLE lt_return TRANSPORTING NO FIELDS WITH KEY type = 'E'.
    IF sy-subrc = 0.
      result = 'X'.
    ENDIF.
  ENDMETHOD.

  " 检查工艺路线是否存在
  METHOD check_exist_by_mapl.
    DATA l_plnnr_alt TYPE plko-plnnr_alt.
    SELECT SINGLE plnnr_alt INTO @l_plnnr_alt
    FROM mapl
    LEFT JOIN plko ON plko~plnty = mapl~plnty
                  AND plko~plnnr = mapl~plnnr
                  AND plko~plnal = mapl~plnal
                  AND plko~zaehl = mapl~zaehl
    WHERE mapl~werks = @werks
      AND mapl~matnr = @matnr
      AND plko~plnnr_alt = @plnnr_alt.
    IF sy-subrc = 0.
      result = 'X'.
    ENDIF.
  ENDMETHOD.

  " 重复物料与工厂下最新的计数
  METHOD next_counter.
    SELECT SINGLE plnnr
      INTO @group
      FROM mapl
      WHERE matnr = @matnr
        AND werks = @werks
        AND plnty = 'N'.
    IF sy-subrc = 0.
      SELECT SINGLE MAX( plnal ) INTO @counter
        FROM plko
        WHERE plko~plnty = 'N'
          AND plko~plnnr = @group.
      counter = counter + 1.
    ENDIF.
  ENDMETHOD.
ENDCLASS.
*&---------------------------------------------------------------------*
*&       Class lcl_routing_change_proxy
*&---------------------------------------------------------------------*
CLASS lcl_routing_change_proxy DEFINITION.
  PUBLIC SECTION.
    METHODS:
      init,
      fill_data_by_type1
        IMPORTING
          head  TYPE zspp_0029_head
          items TYPE zttpp_0029_item,
      execute,
      get_message
        EXPORTING
          type    TYPE bapi_mtype
          message TYPE bapi_msg.

  PRIVATE SECTION.
    DATA ms_maint_hdr TYPE cps_task_list_maint_hdr.
    DATA ms_task TYPE cps_task_list_maint_tsk.
    DATA ms_taskx TYPE cps_task_list_maint_tsk_x.
    DATA mt_mat_task TYPE STANDARD TABLE OF cps_task_list_maint_mtk.
    DATA mt_mat_taskx TYPE STANDARD TABLE OF cps_task_list_maint_mtk_x.
    DATA mt_operation TYPE STANDARD TABLE OF cps_task_list_maint_opr.
    DATA mt_operationx TYPE STANDARD TABLE OF cps_task_list_maint_opr_x.
    DATA mt_return TYPE bapiret2_t.

ENDCLASS.               "lcl_bapi_proxy
*&---------------------------------------------------------------------*
*&       Class lcl_routing_change_proxy
*&---------------------------------------------------------------------*
CLASS lcl_routing_change_proxy IMPLEMENTATION.
  " 运行
  METHOD execute.
    " 修改工艺路线
    CALL FUNCTION 'CPCC_S_TASK_LIST_MAINTAIN'
      EXPORTING
        change_no          = ms_maint_hdr-change_no
        key_date           = ms_maint_hdr-key_date
        task_list_type     = ms_maint_hdr-task_list_type
        task_list_group    = ms_maint_hdr-task_list_group
        group_counter      = ms_maint_hdr-group_counter
        material           = ms_maint_hdr-material
        plant              = ms_maint_hdr-plant
        task_maintain_mode = 'M'
        task               = ms_task
        task_x             = ms_taskx
      TABLES
        operations         = mt_operation
        operations_x       = mt_operationx
        return             = mt_return.
    READ TABLE mt_return TRANSPORTING NO FIELDS WITH KEY type = 'E'.
    IF sy-subrc = 0.
      CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
      RETURN.
    ENDIF.

    CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
      EXPORTING
        wait = 'X'.
  ENDMETHOD.

  " 获取消息
  METHOD get_message.
    READ TABLE mt_return TRANSPORTING NO FIELDS WITH KEY type = 'E'.
    IF sy-subrc = 0.
      type = 'E'.
      LOOP AT mt_return REFERENCE INTO DATA(lr_return).
        MESSAGE ID lr_return->id TYPE lr_return->type
        NUMBER lr_return->number
        WITH lr_return->message_v1 lr_return->message_v2
             lr_return->message_v3 lr_return->message_v4
        INTO DATA(l_message).
        message = |{ message }{ l_message };|.
      ENDLOOP.
    ELSE.
      type = 'S'.
      message = '修改工艺路线成功'.
    ENDIF.
  ENDMETHOD.

  " 根据接口参数填充数据
  METHOD fill_data_by_type1.
    " 用于查询工艺路线，以确定工艺路线行项目是修改还是新增
    DATA lt_query_input TYPE zttpp_0027_input.
    DATA lt_query_output TYPE zttpp_0027_output.
    APPEND VALUE #(
      zsqlx = '修改'
      werks = head-werks
      matnr = head-matnr
      plnnr_alt = head-plnnr_alt
    ) TO lt_query_input.
    " 工艺路线查询
    CALL FUNCTION 'ZPP_OA_ROUTING_QUERY_ESB'
      EXPORTING
        it_input  = lt_query_input
      IMPORTING
        et_output = lt_query_output.
    SORT lt_query_output BY vornr.

    " 抬头
    ms_maint_hdr-key_date = sy-datum.
    ms_maint_hdr-task_list_type = 'N'.
    ms_maint_hdr-task_list_group = head-plnnr. " 工艺路线组
    ms_maint_hdr-group_counter = head-plnal. " 组计数器
    ms_maint_hdr-material = head-matnr. " 物料
    ms_maint_hdr-plant = head-werks. " 工厂

    DEFINE _set_task_field.
      ms_task-&1 = &2.
      ms_taskx-&1 = 'X'.
    END-OF-DEFINITION.
    _set_task_field plant head-werks. " 工厂
    _set_task_field old_number_of_task_list head-plnnr_alt. " 产线
    _set_task_field description head-ktext. " 工艺路线描述
    _set_task_field task_list_usage '1'. " 用途，默认值
    _set_task_field task_list_status '4'. " 状态，默认值
    _set_task_field lot_size_from head-losvn. " 批量下限
    _set_task_field lot_size_to head-losbs. " 产线批量上限
    _set_task_field task_measure_unit 'PCS'. " 单位

    LOOP AT items REFERENCE INTO DATA(lr_item).
      " 工序
      APPEND INITIAL LINE TO mt_operation REFERENCE INTO DATA(lr_operation).
      APPEND INITIAL LINE TO mt_operationx REFERENCE INTO DATA(lr_operationx).

      " 检查工序是否存在，存在修改，不存在新增
      READ TABLE lt_query_output REFERENCE INTO DATA(lr_query_output)
      WITH KEY vornr = lr_item->vornr BINARY SEARCH.
      IF sy-subrc = 0.
        lr_operation->maintain_mode = 'M'.
      ELSE.
        lr_operation->maintain_mode = 'C'.
      ENDIF.
      " 工序编号
      lr_operation->activity = lr_item->vornr.
      lr_operationx->activity = 'X'.
      lr_operation->activity_old  = lr_item->vornr.
      lr_operation->flag_bar_pointer = '1'.

      DEFINE _set_operation_filed.
        lr_operation->&1 = &2.
        lr_operationx->&1 = 'X'.
      END-OF-DEFINITION.
      _set_operation_filed plant head-werks. " 工厂
      _set_operation_filed description lr_item->ltxa1. " 工序短文本
      _set_operation_filed standard_text_key lr_item->vlsch. " 标准文本码
      _set_operation_filed work_cntr lr_item->arbpl. " 工作中心
      _set_operation_filed control_key lr_item->steus. " 控制码
      _set_operation_filed base_quantity lr_item->bmsch. " 工序基本数量
      _set_operation_filed operation_measure_unit lr_item->meinh. " 计量单位
      _set_operation_filed no_of_employee lr_item->anzma. " 雇员数量
      _set_operation_filed denominator '1'.
      _set_operation_filed nominator '1'.

      " 重复代码
      DEFINE _set_acti.
        _set_operation_filed std_unit_0&1 lr_item->vge0&1.
*        _set_operation_filed std_unit_0&1_iso lr_item->vge0&1.
        _set_operation_filed std_value_0&1 lr_item->vgw0&1.
      END-OF-DEFINITION.
      _set_acti 1. " 折旧摊销
      _set_acti 2. " 直接人工
      _set_acti 3. " 间接人工
      _set_acti 4. " 动力费
      _set_acti 5. " 生产耗材
      _set_acti 6. " 维修保养
    ENDLOOP.
  ENDMETHOD.

  " 初始化参数
  METHOD init.
    CLEAR ms_maint_hdr.
    CLEAR ms_task.
    CLEAR ms_taskx.
    CLEAR mt_mat_task.
    CLEAR mt_mat_taskx.
    CLEAR mt_operation.
    CLEAR mt_operationx.
    CLEAR mt_return.
  ENDMETHOD.
ENDCLASS.

```

</details>
