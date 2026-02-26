# Fiori配置相关

## 服务激活

需要激活以下基础服务节点，Fiori才能正常使用

- **/sap/bc/bsp/sap**
- **/sap/bc/ui5_ui5/sap**
- **/sap/opu/odata/sap**

如果以上位置找不到需要激活的节点，可以在事务代码 **/IWFND/MAINT_SERVICE** 中手工添加服务

## 清缓存

- **/UI5/UPD_ODATA_METADATA_CACHE** ，清除OData缓存
- **/UI2/PAGE_CACHE_SYNCHRONIZE** ，清除ICM缓存，主要用于解决Tile翻译没生效问题
- **/UI2/INVALIDATE_CLIENT_CACHES** ，清除网关缓存
- **/UI2/INVALIDATE_GLOBAL_CACHES** ，清除网关缓存

## 角色权限配置

实际项目上，发现要在角色中加入下面权限缺省值，Fiori才能正常打开：

权限缺省值选择 (**R3TR-IWSG**) **18 SAP Gateway: Service Groups Metadata** ，输入下面条目

- **ZINTEROP_0001**
- **ZPAGE_BUILDER_PERS_0001**
- **/IWFND/SG_MED_CATALOG_0001**
- **/IWFND/SG_MED_CATALOG_0002**

权限缺省值选择 (**R3TR-IWSV**) **19 SAP Gateway Business Suite Enablement - Service** ，输入下面条目

- **/UI2/INTEROP                       0001**
- **/UI2/PAGE_BUILDER_PERS             0001**

## VSCode相关

系统要启用服务 **/sap/opu/odata/UI5/ABAP_REPOSITORY_SRV** ，VSCode才能正常使用

关闭病毒扫描 **/IWFND/VIRUS_SCAN** ，实在不能上传项目的时候，再关闭

## 删除服务

有时候SEGW建错服务，需要删除，可以根据下面路径，找到处理程序：

SPRO -> SAP Customizing Implementation Guide -> SAP NetWeaver -> Gateway Service Enablement -> Backend OData Channel -> Service Development for Backend OData Channel

- **Maintain Services**, provide the Technical Service Name and service version; then click on Delete Service button
- **Maintain Models**, provide Technical Model Name and Model Version; then click on delete Model button.
