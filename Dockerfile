FROM node:0.10-slim

RUN apt-get update --fix-missing

RUN apt-get upgrade -y

RUN apt-get install -y git libfreetype6 libfontconfig nginx bzip2

RUN npm -g update npm

RUN npm -g install grunt-cli bower

RUN echo "{\"analytics\": true, \"allowRoot\": true}" > /root/.bowerrc
