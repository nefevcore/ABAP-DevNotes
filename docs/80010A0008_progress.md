# 进度条工具

有时报表运行时间长，为了避免用户以为程序出问题，不妨加个进度条。

<details>
  <summary>ZCL_PROGRESS</summary>

```ABAP

class ZCL_PROGRESS definition
  public
  final
  create public .

public section.

  data M_TOTAL type I .
  data M_CURRENT type I .
  data M_TIME_START type TIMESTAMPL .
  data M_TIME type TIMESTAMPL .
  data M_INTERVAL type I .
  data M_NAME type STRING .

  methods START
    importing
      !TOTAL type I optional
    returning
      value(RESULT) type ref to ZCL_PROGRESS .
  methods NEXT
    importing
      !DELTA type I default 1
    returning
      value(RESULT) type ref to ZCL_PROGRESS .
  methods FINISH
    returning
      value(RESULT) type ref to ZCL_PROGRESS .
  methods current
    importing
      !TEXT type STRING optional .
  methods PERCENTAGE
    returning
      value(RESULT) type F .
  methods DURATION
    returning
      value(RESULT) type F .
  class-methods WRITE
    importing
      !I_TEXT type STRING .
protected section.
private section.
ENDCLASS.



CLASS ZCL_PROGRESS IMPLEMENTATION.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Public Method ZCL_PROGRESS->DURATION
* +-------------------------------------------------------------------------------------------------+
* | [<-()] RESULT                         TYPE        F
* +--------------------------------------------------------------------------------------</SIGNATURE>
  method DURATION.

    result = cl_abap_tstmp=>subtract( tstmp1 = m_time
                                      tstmp2 = m_time_start ).

  endmethod.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Public Method ZCL_PROGRESS->FINISH
* +-------------------------------------------------------------------------------------------------+
* | [<-()] RESULT                         TYPE REF TO ZCL_PROGRESS
* +--------------------------------------------------------------------------------------</SIGNATURE>
  method FINISH.

    result = me.
    GET TIME STAMP FIELD m_time.
    show( ).

  endmethod.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Public Method ZCL_PROGRESS->NEXT
* +-------------------------------------------------------------------------------------------------+
* | [--->] DELTA                          TYPE        I (default =1)
* | [<-()] RESULT                         TYPE REF TO ZCL_PROGRESS
* +--------------------------------------------------------------------------------------</SIGNATURE>
  method NEXT.

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

  endmethod.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Public Method ZCL_PROGRESS->PERCENTAGE
* +-------------------------------------------------------------------------------------------------+
* | [<-()] RESULT                         TYPE        F
* +--------------------------------------------------------------------------------------</SIGNATURE>
  method PERCENTAGE.

    IF m_total <> 0.
      result = m_current / m_total * 100.
    ENDIF.

  endmethod.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Public Method ZCL_PROGRESS->current
* +-------------------------------------------------------------------------------------------------+
* | [--->] TEXT                           TYPE        STRING(optional)
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD current.

    DATA(l_text) = text.
    IF l_text IS INITIAL.
      l_text = |{ percentage( ) DECIMALS = 0 }% [ {
          m_current NUMBER = USER } / { m_total NUMBER = USER } ] {
          duration( ) DECIMALS = 0 }s|.
      IF m_name IS NOT INITIAL.
        l_text = |{ m_name } : { l_text }|.
      ENDIF.
    ENDIF.
    write( l_text ).

  ENDMETHOD.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Instance Public Method ZCL_PROGRESS->START
* +-------------------------------------------------------------------------------------------------+
* | [--->] TOTAL                          TYPE        I(optional)
* | [<-()] RESULT                         TYPE REF TO ZCL_PROGRESS
* +--------------------------------------------------------------------------------------</SIGNATURE>
  method START.

    result = me.
    m_total = total.
    m_current = 0.
    GET TIME STAMP FIELD m_time_start.
    m_time = m_time_start.

  endmethod.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method ZCL_PROGRESS=>WRITE
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_TEXT                         TYPE        STRING
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD write.

    IF sy-batch = ''.
      CALL FUNCTION 'SAPGUI_PROGRESS_INDICATOR'
        EXPORTING
          text = i_text.
    ELSE.
      MESSAGE i_text TYPE 'S'.
    ENDIF.

  ENDMETHOD.
ENDCLASS.

```

</details>

<details open>
  <summary>示例代码</summary>

```ABAP

DATA(lo_progress) = NEW zcl_progress( ).
lo_progress->m_name = 'DMEO'. " 计时器名称，不设置也行，这里只是为了展示全部可设置项
lo_progress->m_interval = 5. " 实际上进度条太频繁也会影响性能，这里设置刷新频率
lo_progress->start( lines( lt_data ) ).
LOOP AT lt_data INTO DATA(ls_data).
  lo_progress->next( 1 ). " 步进数，不设置默认1
ENDLOOP.
lo_progress->finish( ). " 进度直接跳到100，不加也不影响

```

</details>
