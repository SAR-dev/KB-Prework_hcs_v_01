import os, io
import cv2
import base64
import numpy as np
import numba as nb
from PIL import Image
from flask import Flask, render_template, Response, request, send_from_directory
from flask_cors import CORS, cross_origin
import tensorflow as tf
from tensorflow.keras.models import model_from_json
import tensorflow.keras.backend as K

#physical_devices = tf.config.experimental.list_physical_devices('GPU')
#tf.config.experimental.set_memory_growth(physical_devices[0], True)  
    
app = Flask(__name__,template_folder='template')
#app.config['SERVER_NAME'] = '127.0.0.1:8080'
CORS(app)

#loading model
loaded = tf.saved_model.load("./model/")
infer = loaded.signatures["serving_default"]

# colored table
color_table = {
    	
	        '4ab056': [127, 35, 4],
	        'ba7740': [27, 49, 4],
	        'd4253a':[0,32,-4],
	        '932558':[332, 62, 4],
	        '6B9CA8':[192, 26, 4],
	        '5D3984':[269, 40, 3],
	        'F8C649':[51, 30, -4],
	        '185ADB':[244,32,-4],
	        '898BB5': [237, 23, 5],
	        'dd4bc9':[308, 68, 5],
	        'FF6600':[23, 46, -21],
    	}


#default page
@app.route('/')
def index():
	return render_template('index.html')


#predicting mask
def generate_frames(frame, h, s, l_adjust):

    img_face = cv2.resize(frame,(256,256))    
    img_face = cv2.cvtColor(img_face, cv2.COLOR_BGR2RGBA)

    #converting into float32
    img_face_f = (img_face/255.0).astype(np.float32)

    #frame color
    f_img  = colorize(img_face,h,s,l_adjust)
    f_img = (np.array(f_img)/255.0).astype(np.float32)

    #Predicting segmentation
    mask_hair = infer(tf.constant(np.expand_dims(img_face_f[:,:,:3], axis=0)))['conv2d_17'][0]
    K.clear_session()

    #addition of color image with mask
    final_result = img_face_f* (1 - np.array(mask_hair)) + np.array(mask_hair)*f_img
    final_result = cv2.cvtColor(final_result, cv2.COLOR_BGR2RGB)
            
    final_result = (final_result*255).astype(np.uint8)
            
    ret,buffer=cv2.imencode('.jpg',final_result)

    frame=buffer.tobytes()

    return frame



#handle post request
@app.route('/upload/', defaults={'values': None}, methods=['GET', 'POST'])
@app.route('/upload/<values>', methods=['GET', 'POST'])
def upload(values):

    if request.method == 'POST':
        fs = request.files.get('h-img')
        if fs:
            img = cv2.imdecode(np.frombuffer(fs.read(), np.uint8), cv2.IMREAD_UNCHANGED)
            #if not color is passed
            if not values:
            	img  = cv2.imencode('.jpg', img)[1].tobytes()
            	stringData = base64.b64encode(img).decode('utf-8')

            	return stringData

            else:
            	#matching color
            	for i in color_table:
            		if values == i:
            			h,s,l_adjust = color_table[i]

            	h /= 360.0
            	s /= 100.0
            	l_adjust /= 100.0

            	img = np.array(img)
            	stringData = base64.b64encode(generate_frames(img, h, s, l_adjust)).decode('utf-8')

            	return stringData
        else:
            return 'No data found'
    
    return 'POST is required'


#color converter
@nb.njit('float32(float32,float32,float32)')
def hue_to_rgb(p, q, t):
    if t < 0: t += 1
    if t > 1: t -= 1
    if t < 1./6: return p + (q - p) * 6 * t
    if t < 1./2: return q
    if t < 2./3: return p + (q - p) * (2./3 - t) * 6
    return p

#color converter
@nb.njit('UniTuple(uint8,3)(float32,float32,float32)')
def hls_to_rgb(h, l, s):
    if s == 0:
        r = g = b = l
    else:
        q = l * (1 + s) if l < 0.5 else l + s - l * s
        p = 2 * l - q
        r = hue_to_rgb(p, q, h + 1./3)
        g = hue_to_rgb(p, q, h)
        b = hue_to_rgb(p, q, h - 1./3)

    return (int(r * 255.99), int(g * 255.99), int(b * 255.99))

#adjusting HSL color
@nb.njit('void(uint8[:,:,::1],uint8[:,:,::1],float32,float32,float32)', parallel=True)
def colorize_numba(pixin, pixout, h, s, l_adjust):
    for x in nb.prange(pixout.shape[0]):
        for y in range(pixout.shape[1]):
            currentR, currentG, currentB = pixin[x, y, 0]/255 , pixin[x, y, 1]/255, pixin[x, y, 2]/255
            #luminance
            lum = (currentR * 0.2126) + (currentG * 0.7152) + (currentB * 0.0722)
            if l_adjust > 0:
                lum = lum * (1 - l_adjust)
                lum = lum + (1.0 - (1.0 - l_adjust))
            else:
                lum = lum * (l_adjust + 1)
            l = lum
            r, g, b = hls_to_rgb(h, l, s)
            pixout[x, y, 0] = r
            pixout[x, y, 1] = g
            pixout[x, y, 2] = b
            pixout[x, y, 3] = 255

# HSL coloring
def colorize(im, h, s, l_adjust):
    pixin = np.copy(im)
    pixout = np.copy(im)
    colorize_numba(pixin, pixout, h, s, l_adjust)
    return pixout

    
if __name__ == '__main__':
    app.run()








