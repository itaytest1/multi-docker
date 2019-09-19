FROM node:alpine
WORKDIR '/app'
COPY ./package.json ./
Run npm config set registry http://registry.npmjs.org/  
RUN npm install
COPY . .
CMD ["npm", "run", "start"]