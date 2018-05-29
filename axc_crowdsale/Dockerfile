FROM python:3.6.0-alpine
MAINTAINER sh-tatsuno

ARG project_dir=/api/
RUN apk update
RUN apk add zsh vim tmux git tig

WORKDIR $project_dir
ADD . $project_dir
RUN pip install -r requirements.txt

RUN apk add nodejs
RUN npm init -y
RUN npm install -g truffle
RUN truffle install zeppelin

RUN truffle compile

CMD ["python","main.py"]
