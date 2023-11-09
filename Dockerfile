FROM node:alpine AS development
WORKDIR /backend
COPY ./package.json /backend
COPY ./package-lock.json /backend
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "run", "server"]