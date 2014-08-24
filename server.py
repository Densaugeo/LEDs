# Original python script for controlling gpio pins on Raspberry Pi
# This one ran a websocket and http server and expected a direct connection
#   from the client

import tornado.ioloop
import tornado.web
import tornado.websocket
from datetime import datetime
import json

def timestamp():
  return datetime.strftime(datetime.utcnow(), "%d %B %Y %I:%M:%S")

class MainHandler(tornado.web.RequestHandler):
  def prepare(self):
    print(timestamp() + ": Received request at /")
  def get(self):
    self.render("./http/index.html")

class ControlSocket(tornado.websocket.WebSocketHandler):
  def open(self):
    print(timestamp() + ": Websocket opened")
  
  def on_message(self, message):
    print(timestamp() + ": Received message: " + message)
    
    messageobject = json.loads(message)
  
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
