#!/usr/bin/env python3
# basic device scanning script loops over ch2 and ch1 
# backgate on ch2+, src on ch1+
# to determine Dirac or Inflection Point
import time
#import hardware
import hardware
import numpy as np
import redis
import websockets
import asyncio
import json
import uuid
import sys
import threading
from time import sleep
import signal
 
class Job(threading.Thread):
 
    def __init__(self):
        threading.Thread.__init__(self)
 
        # The shutdown_flag is a threading.Event object that
        # indicates whether the thread should be terminated.
        self.shutdown_flag = threading.Event()
 
        # ... Other thread setup code here ...
 
    def run(self):
        print('Thread #%s started' % self.ident)
        measure()
 
        while not self.shutdown_flag.is_set():
            # ... Job code here ...
            print('Trueeeeee!')
            time.sleep(0.5)
 
        # ... Clean shutdown code here ...
        print('Thread #%s stopped' % self.ident)
 
 
class ServiceExit(Exception):
    """
    Custom exception which is used to trigger the clean exit
    of all running threads and the main program.
    """
    pass
 
 
def service_shutdown(signum, frame):
    print('Caught signal %d' % signum)
    raise ServiceExit
 
 
def main():
 
    # Register the signal handlers
    signal.signal(signal.SIGTERM, service_shutdown)
    signal.signal(signal.SIGINT, service_shutdown)
 
    print('Starting main program')
 
    # Start the job threads
    try:
     #   j1.start()
 
        # Keep the main thread running, otherwise signals are ignored.
        while True:
            asyncio.get_event_loop().run_until_complete(hello())
            time.sleep(0.5)
 
    except ServiceExit:
        print(close)
        # Terminate the running threads.
        # Set the shutdown flag on each thread to trigger a clean shutdown of each thread.
        #j1.shutdown_flag.set()
        # Wait for the threads to close...
        #j1.join()
 
    print('Exiting main program')
 
 


redisClient = redis.StrictRedis(host='localhost',port=6379,db=0)
#vars
#
#stop and measure for this many steps at inflection point
#inflection_voltage = 2
inflection_voltage =  5
inflection_steps = 5000
goofy = False
simulate = False
#analog range 5: -150mv to 150mv
arange = 5;
aref = 'diff'
num_scans = 10
vmin = 0.0
vmax = 10.0
stepsize =  0.25
vbias = 0.14
chansupply = 1
vsupply = 5
#which channel is used for bias
chanbias = 2
cycles = 1
#bias resistor value
rbias=940000


#XDLD-1 working range
#devrange = [1,2,3,4,6,7,8,9,15,16,19,20,21,22,23,24,25,26,27]
#XDLD working range
#devrange = [1,5,6,8,9,10,11,12,13,15,16,17,18,24,25]
#devices we'll scan
#devrange = [1]
#AQSP working range
#ARSG working range
#devrange = [1,2,3,4,5,6,7,8,9]
#ARSG-1 working range
#devrange = [19,20,22,23,26,27]
#KQHH working range
devrange = [8,12,14,16,19,21,22,23,25]
##devrange =[19,20,21,22,23,24,25,26,27]
#devrange = [1,2,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27]
#,devrange = range(1,28)
#devrange = range(1,10)
#BXQC working range
#devrange =[19,20,22,23,25,26,27]
#KSJN working 
#devrange = [1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,20,21,22,23,26,27]
#KSJN working 
#devrange = [20,21,22,23,27]
#LZEP working
#devrange = [1,2,3,4,5,6,8,]
#devrange = [19,20,22,23,24,25,26,27]
#KIWS working range
#devrange = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27]
def sweep(vmin,vmax,stepsize):
    vlist = []
    for vout in np.arange(vmin, vmax, stepsize):
        vlist.append(np.around(vout,2))
    for vout in np.arange(vmin, vmax, stepsize):
        vlist.append(np.around(vmax-vout,2))
    vlist.append(0)
    return(vlist)

#scan the chip from 0:-vmax:0:vmax:0
#epoch: time of meaasurement
#dev: chip device number
#cycle: scan number 
#Vbg: backgate voltage
#vbias: src-drain resistor voltage
#val: adc mesurement value
#VbgSet power supply reported voltage
#VbgMeas: power supply reported voltage
#IbgMeas: power supply reported current
#chipid: name of the chip being scanned
def scan(vrange,devrange,hw,run_id):
    def measure_group(cyclenum,iteration):
        for d in devrange:
            async def syncit():
                async with websockets.connect(
                        'ws://padio:6789') as websocket:
                    action = json.dumps({'action': 'set_did', 'value': d})
                    await websocket.send(action)
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(syncit())
            time.sleep(.5) 
            val=hw.measure(arange,aref,num_scans)
            epoch=time.time()
            measurement={'epoch':epoch,'dev':d,'cycle':cyclenum,'iteration':iteration,'VbgSet':VbgSet,'VbgMeas':VbgMeas,'IbgMeas':IbgMeas,'vbias':vbias,'val':val}
            print(str(epoch) + "," + str(d) + "," + str(cyclenum)  + "," + str(iteration) + "," + str(VbgSet)  + "," + str(vbias) + "," + str(val))
            redisClient.lpush(run_id,json.dumps(measurement))

    for i in range(0,cycles * 2):
        inflection_reached = False;
        if i % 2 == 0:
            hw.negative = False
        else:
            hw.negative = True
        for vgate in vrange:
            hw.syncDio()
            vresult=hw.hpsetV(vgate)
            VbgMeas=vresult[0]
            IbgMeas=vresult[1]
            if(hw.negative):
                VbgSet = - + vgate
            else:
                VbgSet = vgate
            if VbgSet  == inflection_voltage and inflection_reached:
                #print("inflection point at " +str(vgate) + " volts")
                for j in range(0,inflection_steps):
                    measure_group(i,j)
            else:
                measure_group(i,0)
            if VbgSet == inflection_voltage:
                inflection_reached = True;

async def hello():
    async with websockets.connect(
            'ws://localhost:6789') as websocket:
        while True:
            try:
                name = await websocket.recv()
                state = json.loads(name)
                if 'running' in state.keys():
                    running = state['running']
                    if running == 1:
                        if 'j1' in locals() and j1.isAlive():
                            print("already running")
                        else: 
                            j1 = Job()
                            j1.start()
                    if running == 0:
                        try:
                            j1.shutdown_flag.set()
                        except NameError:
                            print('not running')
            except websockets.ConnectionClosed:
                print("Websocket closed - Terminated")
                break

def measure():
    if(len(sys.argv) <= 1):
        print("error: must specify chip id")
        exit()
    chip_id = sys.argv[1];
    run_id = str(uuid.uuid4())
    print(run_id)
    epoch=time.time()
    run={'epoch':epoch,'run_id':run_id,'chip_id':chip_id,'vmin':vmin,'vmax':vmax,'stepsize':stepsize,'vbias':vbias,'rbias':rbias,'inflection_voltage':inflection_voltage}
    redisClient.lpush('runs',json.dumps(run))
    hw=hardware.Hw()
    hw.start()
    hw.setV(chansupply,vsupply)
    hw.setV(chanbias,vbias)
    vrange = sweep(vmin,vmax,stepsize)
    scan(vrange,devrange,hw,run_id)
    hw.stop()

if __name__ == '__main__':
    measure()

