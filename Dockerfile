FROM node:12

WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD npm run start:prod

EXPOSE 4000
