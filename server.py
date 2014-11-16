# Original python script for controlling gpio pins on Raspberry Pi
# This one ran a websocket and http server and expected a direct connection
#   from the client

import tornado.ioloop
import tornado.web
import tornado.websocket
from datetime import datetime
import json
from Adafruit_PWM_Servo_Driver import PWM

def timestamp():
  return datetime.strftime(datetime.utcnow(), "%d %B %Y %I:%M:%S")

pwm = PWM(0x40)
pwm.setPWMFreq(1000)

class MainHandler(tornado.web.RequestHandler):
  def prepare(self):
    print(timestamp() + ": Received request at /")
  def get(self):
    self.render("./http/index.html")

class ControlSocket(tornado.websocket.WebSocketHandler):
  def open(self):
    print(timestamp() + ": Websocket opened")
  
  def on_message(self, message):
    led   = int((message[1] + message[0]).encode('hex'), 16)
    red   = int((message[3] + message[2]).encode('hex'), 16)
    green = int((message[5] + message[4]).encode('hex'), 16)
    blue  = int((message[7] + message[6]).encode('hex'), 16)
    alpha = int((message[9] + message[8]).encode('hex'), 16)
    
    pwm.setPWM(3*led    , 0,   red*alpha/4095)
    pwm.setPWM(3*led + 1, 0, green*alpha/4095)
    pwm.setPWM(3*led + 2, 0,  blue*alpha/4095)
  
  def on_close(self):
    print(timestamp() + ": Websocket closed")
  
  def check_origin(self, origin):
    return True

application = tornado.web.Application([
  (r"/", MainHandler),
  (r"/websocket", ControlSocket),
  (r'/(.*)', tornado.web.StaticFileHandler, {'path': './http/'}),
  ])

if __name__ == "__main__":
  application.listen(8080, "0.0.0.0")
  print(timestamp() + ": Starting server listening on port 8070 (all hosts)")
  tornado.ioloop.IOLoop.instance().start()
