FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# In a real build, we'd run prisma generate here or build the remix app
# RUN npx prisma generate
# RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
