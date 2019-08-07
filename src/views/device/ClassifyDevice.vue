<template>
  <div class="classify-container">
    <div class="operate-btn">
      <el-button type="primary" size="mini" style="float: right;" @click="addDevice">添加设备</el-button>
    </div>
    <div class="page-diagram" id="myDiagramDiv"></div>
    <el-dialog title="添加设备" :visible.sync="dialogFormVisible" width="40%" class="addDeviceDialog">
      <el-form :rules="deviceRules"
               ref="dataForm"
               :model="temp"
               label-width="100px"
               :disabled="temp.virtual"
               style='width: 80%; margin:0 auto;'>
        <el-form-item :label="$t('table.deviceName')" prop="name">
          <el-input v-model="temp.name"></el-input>
        </el-form-item>
        <el-form-item :label="$t('table.deviceIP')" prop="hostAddress">
          <el-input v-model="temp.hostAddress"></el-input>
        </el-form-item>
        <el-form-item :label="$t('table.devicePath')" prop="deployPath">
          <el-tooltip placement="top">
            <div slot="content">此路径为设备接收部署文件的路径。例如:<br/>Windows: C:/test<br/>Linux: /test<br/>Vxworks: /test</div>
            <el-input v-model="temp.deployPath" placeholder="例如：D:/test"></el-input>
          </el-tooltip>
        </el-form-item>
        <el-form-item :label="$t('table.deviceDesc')" prop="description">
          <el-input v-model="temp.description"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary"
                   @click="createData"
                   style="float: right;"
                   :loading="creDevLoading">
          {{$t('table.confirm')}}
        </el-button>
        <el-button @click="dialogFormVisible = false" style="float: right;margin-right: 10px">{{$t('table.cancel')}}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import { getAllDevices, saveDevices } from '@/api/device'
  import go from 'gojs'

  const $ = go.GraphObject.make
  export default {
    name: 'ClassifyVue',
    data() {
      const validateIP = (rule, value, callback) => {
        const exp = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
        const reg = value.match(exp)

        if (value.length === 0) {
          callback(new Error('请输入IP！'))
        } else if (reg == null) {
          callback(new Error('IP地址不合法！'))
        } else {
          callback()
        }
      }
      const validatePath = (rule, value, callback) => {
        const pattern = /^([a-zA-Z]:(\\))([a-zA-Z]*)|(\/([a-zA-Z]+))*$/

        if (value.length === 0) {
          callback(new Error('请输入路径！'))
        } else if (!(value.match(pattern))) {
          callback(new Error('路径格式不正确!'))
        } else {
          callback()
        }
      }
      return {
        proId: '',
        diagram: null,
        deviceList: [],
        dialogFormVisible: false,
        creDevLoading: false,
        temp: {
          name: '',
          hostAddress: '',
          deployPath: '',
          description: ''
        },
        deviceRules: {
          name: [{ required: true, message: '请输入设备名', trigger: 'blur' }],
          hostAddress: [{ required: true, trigger: 'blur', validator: validateIP }],
          deployPath: [{ required: true, trigger: 'blur', validator: validatePath }]
        }
      }
    },
    methods: {
      addNode(device) {
        if (!this.diagram) {
          return
        } else {
          this.diagram.add( // add an unbound Node to the diagram at a random position
            $(
              go.Node,
              'Spot', // the Shape automatically fits around the TextBlock
              {
                locationSpot: go.Spot.Center,
                resizeObjectName: 'PICTURE',
                deletable: false
              },
              new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(
                go.Point.stringify
              ),
              $(
                go.Panel,
                'Vertical',
                $(
                  go.Picture,
                  {
                    name: 'PICTURE',
                    desiredSize: new go.Size(40, 40),
                    cursor: 'pointer',
                    source: 'static/svg/device.svg'
                  },
                  new go.Binding('desiredSize', 'size', go.Size.parse).makeTwoWay(
                    go.Size.stringify
                  )
                ),
                $(
                  go.TextBlock,
                  {
                    font: 'normal normal normal 10pt 宋体',
                    editable: false,
                    isUnderline: false,
                    isStrikethrough: false,
                    minSize: new go.Size(10, NaN),
                    stroke: '#333',
                    text: device.name + '-' + device.hostAddress
                  }
                )
              )
            )
          )
        }
      },
      init() {
        getAllDevices(this.proId).then(res => {
          this.deviceList = res.data.data
          this.diagram = $(go.Diagram, 'myDiagramDiv',
            {
              'undoManager.isEnabled': true
            })
          for (let i = 0; i < this.deviceList.length; i++) {
            const device = this.deviceList[i]
            this.addNode(device)
          }
        })
      },
      addDevice() {
        this.dialogFormVisible = true
        this.temp = {
          name: '',
          hostAddress: '',
          deployPath: '',
          description: ''
        }
        this.$nextTick(() => {
          this.$refs['dataForm'].clearValidate()
        })
      },
      createData() {
        this.$refs['dataForm'].validate((valid) => {
          if (valid) {
            this.creDevLoading = true
            const formData = new FormData()
            formData.append('name', this.temp.name)
            formData.append('hostAddress', this.temp.hostAddress)
            formData.append('deployPath', this.temp.deployPath)
            formData.append('description', this.temp.description)
            saveDevices(this.proId, formData).then((res) => {
              this.creDevLoading = false
              this.dialogFormVisible = false
              this.$notify({
                title: '成功',
                message: '创建成功',
                type: 'success',
                duration: 2000
              })
              const device = res.data.data
              this.addNode(device)
            }).catch((error) => {
              this.creDevLoading = false
              this.errorMessage = '操作失败！'
              if (error.response.data.message) {
                this.errorMessage = error.response.data.message
              }
              this.$notify({
                title: '创建设备失败',
                message: this.errorMessage,
                type: 'error',
                duration: 2000
              })
            })
          }
        })
      }
    },
    created() {
      this.proId = this.getCookie('projectId')
    },
    mounted() {
      this.init()
    }
  }
</script>

<style lang="scss" scoped>
  .classify-container {
    position: absolute;
    width: 100%;
    top: 80px;
    bottom: 0;
    padding: 20px;

    .operate-btn {
      height: 30px;
    }

    .page-diagram {
      width: 100%;
      height: calc(100% - 40px);
      background: #fff;
      border: solid 1px black;
      margin-top: 10px;
    }
  }

</style>
