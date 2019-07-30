<template>
  <div class="simulation">
    <div class="operation-bar">
      <div class="mani">
        <svg-icon icon-class="components3"></svg-icon>
        <span class="operation-name">操作</span>
      </div>
      <div class="main-mani">
        <span class="operation-item" @click="simOperation('start')">
          <svg-icon icon-class="开始"></svg-icon>
          <span class="operation-name">开始</span>
        </span>
        <span class="operation-item" @click="simOperation('suspend')">
          <svg-icon icon-class="暂停"></svg-icon>
          <span class="operation-name">暂停</span>
        </span>
        <span class="operation-item" @click="simOperation('stepThrough')">
          <svg-icon icon-class="step"></svg-icon>
          <span class="operation-name">步长</span>
        </span>
        <span class="operation-item" @click="simOperation('stepSize')">
          <svg-icon icon-class="singleStep"></svg-icon>
          <span class="operation-name">单步</span>
        </span>
        <span class="operation-item" @click="simOperation('recover')">
          <svg-icon icon-class="刷新"></svg-icon>
          <span class="operation-name">恢复</span>
        </span>
        <span class="operation-item" @click="simOperation('stop')">
          <svg-icon icon-class="停止"></svg-icon>
          <span class="operation-name">停止</span>
        </span>
        <span class="operation-item">
          <svg-icon icon-class=""></svg-icon>
        </span>
      </div>
    </div>
    <div class="simulation-container">
      <multipane class="custom-resizer" layout="horizontal" style="height: 95%;">
        <div class="pane" :style="{ height: '70%', minHeight: '60%', maxHeight: '80%' }">
          <el-row :gutter="20">
            <el-col :span="5">
              <div class="tree-container">
                <el-input style="margin-bottom: 20px" class="filter-item" placeholder="请输入"></el-input>
                <el-tree :data="treeData" :props="defaultProps"></el-tree>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="var-container">
                <div class="container-name">
                  <span>运行状态</span>
                  <!--<span class="component-name">（组件1）</span>-->
                </div>
                <!--<div class="socketResBox">{{socketRes}}</div>-->
                <div class="socketResBox" v-if="socketRes">
                  <div class="socketValue" v-for="(value, key) in socketRes[0]">
                    <span class="socket-key">{{key}}:</span>
                    <span class="socket-value">{{value}}</span>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="11">
              <div class="func-container">
                <div class="container-name">
                  <span>接口函数</span>
                  <span class="component-name">（组件1）</span>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
        <multipane-resizer></multipane-resizer>
        <div class="pane" :style="{ flexGrow: 1 }">
          <hr/>
          <div class="my-terminal-container">
            <vue-terminal :task-list="taskList" :command-list="commandList"></vue-terminal>
          </div>
        </div>
      </multipane>
    </div>
  </div>
</template>
<script>
  import vueTerminal from './VueTerminal'
  import { Multipane, MultipaneResizer } from 'vue-multipane'
  import { simOperate } from '../../api/simulate'
  import qs from 'qs'
  import service from '@/utils/request'
  import Stomp from 'stompjs'
  import SockJS from 'sockjs-client'

  function generateTime() {
    const timeNow = new Date()
    const hours = timeNow.getHours()
    const minutes = timeNow.getMinutes()
    const seconds = timeNow.getSeconds()
    let timeString = '' + hours
    timeString += (minutes < 10 ? ':0' : ':') + minutes
    timeString += (seconds < 10 ? ':0' : ':') + seconds
    return timeString
  }

  const mockData = [
    {
      time: generateTime(),
      type: 'system',
      label: 'System',
      message: 'Welcome to vTerminal, this is an example to show you what this project can do.'
    },
    { time: generateTime(), type: 'info', label: 'Info', message: 'Terminal Initializing ............' },
    { time: generateTime(), type: 'warning', label: 'warning', message: 'This is a Waning Message!' },
    { time: generateTime(), type: 'error', label: 'Error', message: 'Oops, Something Went Wrong!' },
    { time: generateTime(), type: 'success', label: 'Success', message: 'Take it easy! Everything OK!' }
  ]

  export default {
    name: 'simulation',
    components: {
      vueTerminal,
      Multipane,
      MultipaneResizer
    },
    data() {
      return {
        socketRes: null,
        deviceId: '',
        operationMap: {
          'start': '开始',
          'suspend': '暂停',
          'stop': '结束',
          'recover': '恢复',
          'stepThrough': '步长调试',
          'stepSize': '单步调试'
        },
        taskList: {
          echo: {
            description: 'Echoes input',
            echo(pushToList, input) {
              input = input.split(' ')
              input.splice(0, 1)
              const p = new Promise(resolve => {
                pushToList({ time: generateTime(), label: 'Echo', type: 'success', message: input.join(' ') })
                resolve({ type: 'success', label: '', message: '' })
              })
              return p
            }
          },
          defaultTask: {
            description: 'this is default task.',
            defaultTask(pushToList) {
              let i = 0
              const p = new Promise(resolve => {
                const interval = setInterval(() => {
                  mockData[i].time = generateTime()
                  pushToList(mockData[i])
                  i++
                  if (!mockData[i]) {
                    clearInterval(interval)
                    resolve({ type: 'success', label: 'Success', message: 'Example Over!' })
                  }
                }, 1000)
              })
              return p
            }
          },
          open: {
            description: 'Open a specified url in a new tab.',
            open(pushToList, input) {
              const p = new Promise((resolve, reject) => {
                let url = input.split(' ')[1]
                if (!url) {
                  reject({ type: 'error', label: 'Error', message: 'a url is required!' })
                  return
                }
                pushToList({ type: 'success', label: 'Success', message: 'Opening' })

                if (input.split(' ')[1].indexOf('http') === -1) {
                  url = 'http://' + input.split(' ')[1]
                }
                window.open(url, '_blank')
                resolve({ type: 'success', label: 'Done', message: 'Page Opened!' })
              })
              return p
            }
          },
        },
        commandList: {
          version: {
            description: 'Return this project version',
            messages: [
              { message: '1.0.0' }
            ]
          },
          contact: {
            description: 'How to contact author',
            messages: [
              { message: 'Website: http://xiaofeixu.cn' },
              { message: 'Email: xuxiaofei915@gmail.com' },
              { message: 'Github: https://github.com/dongsuo' },
              { message: 'WeChat Offical Account: dongsuo' }
            ]
          },
          about: {
            description: 'About author',
            messages: [
              { message: 'My name is xu xiaofei. I\'m a programmer, You can visit my personal website at http://xiaofeixu.cn to learn more about me.' }
            ]
          },
          readme: {
            description: 'About this project.',
            messages: [
              { message: 'This is a component that emulates a command terminal in Vue' }
            ]
          },
          document: {
            description: 'Document of this project.',
            messages: [
              {
                message: {
                  text: 'Under Construction',
                  list: [
                    { label: 'hello', type: 'error', message: 'this is a test message' }
                  ]
                }
              }]
          },
          runMyScript: {
            description: 'myFunction',
            messages: [
              { message: 'return a origin result by rengu' }
            ]
          }
        },
        treeData: [
          {
            label: '一级 1',
            children: [{
              label: '二级 1-1',
              children: [{
                label: '三级 1-1-1'
              }]
            }]
          },
          {
            label: '一级 2',
            children: [{
              label: '二级 2-1',
              children: [{
                label: '三级 2-1-1'
              }]
            }, {
              label: '二级 2-2',
              children: [{
                label: '三级 2-2-1'
              }]
            }]
          },
          {
            label: '一级 3',
            children: [{
              label: '二级 3-1',
              children: [{
                label: '三级 3-1-1'
              }]
            }, {
              label: '二级 3-2',
              children: [{
                label: '三级 3-2-1'
              }]
            }]
          }],
        defaultProps: {
          children: 'children',
          label: 'label'
        }
      }
    },
    methods: {
      subscribe() {
        const url = service.defaults.baseURL + '/OMS'
        const socket = new SockJS(url)
        const stompClient = Stomp.over(socket)
        stompClient.debug = null
        const self = this
        stompClient.connect({}, function(frame) {
          stompClient.subscribe('/simEngine/' + self.deviceId, function(response) {
            // console.log(response.body)
            // self.socketRes = response.body
            const resBody = response.body
            const resBody2 = resBody.replace(/[\\]/g, '')
            self.socketRes = JSON.parse(resBody2)
          })
        })
      },
      simOperation(cmd) {
        const data = {
          simEngineCmd: cmd
        }
        const dataPost = qs.stringify(data)
        simOperate(this.deviceId, dataPost).then((res) => {
          this.$notify({
            title: '成功',
            message: this.operationMap[cmd] + '操作成功',
            type: 'success',
            duration: 2000
          })
        }).catch(() => {
          this.$notify({
            title: '失败',
            message: this.operationMap[cmd] + '操作失败',
            type: 'error',
            duration: 2000
          })
        })
      }
    },
    created() {
      this.deviceId = this.$route.params.id
      this.subscribe()
    }
  }
</script>

<style scoped>
  .simulation {
    width: 100%;
    background-color: #eee;
    /*position: absolute;
    top: 86px;
    bottom: 0;*/
  }

  .operation-bar {
    height: 40px;
    line-height: 40px;
  }

  .mani {
    float: left;
    margin-left: 15px;
  }

  .main-mani {
    float: right;
  }

  .operation-item {
    margin-left: 10px;
    cursor: pointer;
  }

  .operation-name {
    margin-left: 4px;
  }

  .simulation-container {
    position: absolute;
    bottom: 0;
    top: 136px;
    width: 100%;
    padding: 0 10px;
  }

  .simulation-container .el-row, .el-col {
    height: 100%;
  }

  .var-container, .func-container {
    height: 100%;
    border: 1px solid #ccc;
    -webkit-border-radius: 2px;
    -moz-border-radius: 2px;
    border-radius: 2px;
  }

  .container-name {
    height: 30px;
    line-height: 30px;
    background: rgb(59, 132, 195);
    color: #fff;
    padding: 0 6px;
    font-size: 14px;
    font-weight: bold;
  }

  .component-name {
    float: right;
  }

  .my-terminal-container {
    /*height: 300px;*/
    position: absolute;
    height: 100%;
    width: 100%;
  }
  hr {
    border: 0;
    height: 0;
    box-shadow: 0 0 10px 1px black;
    margin-bottom: 2px;
  }
  .pane {
  }
  .socketResBox {
    word-wrap:break-word;
    padding: 10px;
    line-height: 30px;
    overflow-y: scroll;
  }
  /*.socketValue {*/
    /*padding: 0;*/
  /*}*/
  .socket-key {
    color: #333;
    font-weight: 700;
  }
  .socket-value {
    color: #555;
  }
</style>
