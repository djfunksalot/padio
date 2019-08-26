#!/usr/bin/env python3
# basic device scanning script loops over ch2 and ch1 
# backgate on ch2+, src on ch1+
# to determine Dirac or Inflection Point
import logging as _logging
import time
import sys
#from psychopy import parallel
from statistics import median
#vars
MAX_SAMPLES = 128
LOG = _logging.getLogger('comedi-insn')
LOG.addHandler(_logging.StreamHandler())
LOG.setLevel(_logging.ERROR)
comedidev = '/dev/comedi0'
channel = 1
subdevice = 0
arange = 5;
aref = 'diff';
#number of measurements to average over for a single returned value
num_scans = 10


global polarity
def enableP():
    global curchan
    curchan=1


#hardware interface
class Hw(object):
    def start(self):
        print("starting")
    def setV(self,chan,v):
        print("setting chan: " + str(chan) + " to " + str(v) + " volts") 
    def stop(self):
        print("stopping")
    def measure(self,arange,aref,num_scans):
        return(0)
    def syncDio(self):
        return(0)
    def hpsetI(self,i):
        #print("hpsetI: " + str(i))
        return(0,0)
    def hpsetV(self,i):
        #print("hpsetV: " + str(i))
        return(0,0)

def insn_str(insn):
    return ', '.join([
            'insn: {}'.format(insn.insn),
            'subdev: {}'.format(insn.subdev),
            'n: {}'.format(insn.n),
            'data: {!r}'.format(insn.data),
            'chanspec: {}'.format(insn.chanspec),
            ])
