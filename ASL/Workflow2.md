#data collection and training
cd ASL
adb pull /sdcard/Android/data/com.signvision.app/files/DATA ./DATA
python merge_captures.py
python train_model.py

#check mobile data
adb shell ls /sdcard/Android/data/com.signvision.app/files/DATA
#delete from mobile 
adb shell rm -rf /sdcard/Android/data/com.signvision.app/files/DATA

#server update
'''
cd SignVision_ML_backend
git add asl_model.pkl
git commit -m "Updated training"
git push
'''

#after collecting 200+ samples for all letters, if the accuracy is still 100% (overfitting)
#train model using 
python train_model2.py
 


 Test WebSocket Endpoint (before touching the app)
 Install wscat: npm install -g wscat 
 Connect: wscat -c wss://signvision-ml-backend.onrender.com/ws
 Send a test message:
 {"landmarks":[0,0,0,0.1,0.2,0.3,0.2,0.3,0.4,0.3,0.4,0.5,0.4,0.5,0.6,0.1,0.1,0.2,0.2,0.2,0.3,0.3,0.3,0.4,0.4,0.4,0.5,0.15,0.15,0.25,0.25,0.25,0.35,0.35,0.35,0.45,0.45,0.45,0.55,0.2,0.2,0.3,0.3,0.3,0.4,0.4,0.4,0.5,0.5,0.5,0.6,0.25,0.25,0.35,0.35,0.35,0.45,0.45,0.45,0.55,0.55,0.55,0.65],"id":1} 
 You should get back something like: {"prediction":"A","confidence":0.85,"id":1}
 - If this works, the backend is Good
 
  3. Test HTTP Fallback Still Works                                                                                                                                                                                                                                                                 - In browser or Postman, POST to https://signvision-ml-backend.onrender.com/predict with the same landmarks JSON body                            - Should get the same prediction response — confirms old endpoint is untouched 