FROM node:6-alpine

EXPOSE 8877

ADD . /usr/src/app

WORKDIR /usr/src/app

RUN echo 'export PATH=$PATH:/usr/src/app/node_modules/.bin' >> ~/.bashrc

RUN cd /usr/src/app && \
    npm config set registry http://registry.npmjs.org/ && \
    npm install

CMD ["node", "./index.js"]
