FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS scheduler-build
RUN apk add --no-cache build-base
WORKDIR /app/os_engine
COPY os_engine/fcfs.c os_engine/non_preemptive_priority.c ./
COPY os_engine/sjf.c os_engine/round_robin.c os_engine/multilevel_queue.c ./
RUN gcc -std=c11 -Wall -Wextra -O2 fcfs.c -o fcfs \
    && gcc -std=c11 -Wall -Wextra -O2 non_preemptive_priority.c -o priority \
    && gcc -std=c11 -Wall -Wextra -O2 sjf.c -o sjf \
    && gcc -std=c11 -Wall -Wextra -O2 round_robin.c -o round_robin \
    && gcc -std=c11 -Wall -Wextra -O2 multilevel_queue.c -o multilevel_queue

FROM node:20-alpine AS app
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist ./public
COPY --from=scheduler-build /app/os_engine/fcfs /app/os_engine/fcfs
COPY --from=scheduler-build /app/os_engine/priority /app/os_engine/priority
COPY --from=scheduler-build /app/os_engine/sjf /app/os_engine/sjf
COPY --from=scheduler-build /app/os_engine/round_robin /app/os_engine/round_robin
COPY --from=scheduler-build /app/os_engine/multilevel_queue /app/os_engine/multilevel_queue
EXPOSE 8080
CMD ["node", "server.js"]
