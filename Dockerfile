FROM python:3.8.12

# Set the working directory to /app
WORKDIR /hair_color_app

# Copy the current directory contents into the container at /app
COPY . /hair_color_app

RUN pip3 install -r requirements.txt

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]