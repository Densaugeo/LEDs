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
    try:
      messageobject = json.loads(message)
    except ValueError:
      print("No valid JSON object")
      return
    
    try:
      pin = int(messageobject["pin"])
      value = int(messageobject["value"])
    except ValueError:
      print("Pin or PWM value not a valid integer")
      return
    except AttributeError:
      print("Pin or PWM value not defined")
      return
    
    if (pin < 0 or pin > 15):
      print("Pin number out of range")
      return
    if (value < 0 or value > 4095):
      print("PWM value out of range")
      return
    
    pwm.setPWM(pin, 0, value)
  
  def on_close(self):
    print(timestamp() + ": Websocket closed")

application = tornado.web.Application([
  (r"/", MainHandler),
  (r"/websocket", ControlSocket),
  (r'/(.*)', tornado.web.StaticFileHandler, {'path': './http/'}),
  ])

if __name__ == "__main__":
  application.listen(8080, "0.0.0.0")
  print(timestamp() + ": Starting server listening on port 8080 (all hosts)")
  tornado.ioloop.IOLoop.instance().start()
